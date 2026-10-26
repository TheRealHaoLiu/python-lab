"""labkit: the Python side of the lab page.

Runs inside a Web Worker on Pyodide (real CPython compiled to WebAssembly).
The page calls dispatch(fn, args_json) and gets JSON back. Everything a
student types is executed by real Python; this file only captures output,
formats errors the way the python command does, and reports which boxes
of the picture a line touched.
"""
import ast
import builtins
import copy
import io
import json
import linecache
import sys
import traceback

SCRIPT = "homework.py"
SHELL = "<stdin>"
CELL = "<cell>"
MAX_LINES = 500

SHELLS = {}  # question id -> namespace behind the picture and the >>> prompt
STEPS = {}   # question id -> state for the Step button
INPUTS = None  # answers waiting for input() while homework.py runs; None = input() isn't offered here


def _input(prompt=""):
    """input() for homework.py: takes the next answer from the box next to Run.
    Shows the prompt and the answer together, like a terminal does."""
    if INPUTS is None:
        raise RuntimeError("input() doesn't work in this box. Put the value straight into your code instead.")
    if not INPUTS:
        raise EOFError("EOF when reading a line")
    answer = INPUTS.pop(0)
    sys.stdout.write(f"{prompt}{answer}\n")
    return answer


builtins.input = _input


# ---------- helpers ----------

def simple(v, depth=0):
    """A JSON-safe copy of a value, so the page can draw it."""
    if v is None or isinstance(v, (bool, str)):
        return v
    if isinstance(v, int) and abs(v) < 2**53:
        return v
    if isinstance(v, (list, tuple)) and depth < 4 and len(v) <= 60:
        return {"t": "list" if isinstance(v, list) else "tuple",
                "items": [simple(x, depth + 1) for x in v]}
    if isinstance(v, dict) and depth < 4 and len(v) <= 60:
        return {"t": "dict", "items": [[simple(k, depth + 1), simple(x, depth + 1)] for k, x in v.items()]}
    return {"t": "other", "r": repr(v)[:300]}


def register(filename, src):
    """Let tracebacks quote the student's source line, like real Python."""
    linecache.cache[filename] = (len(src), None, src.splitlines(True), filename)


def _only(e):
    # Built from the traceback so NameError/AttributeError keep "Did you mean ...?"
    return list(traceback.TracebackException(type(e), e, e.__traceback__).format_exception_only())


def fmt_exc(e, filename):
    if isinstance(e, SyntaxError):
        return "".join(_only(e)).rstrip()
    frames = [f for f in traceback.extract_tb(e.__traceback__) if f.filename == filename]
    parts = ["Traceback (most recent call last):\n"]
    parts += traceback.format_list(frames)
    parts += _only(e)
    return "".join(parts).rstrip()


def last_line(e):
    lines = "".join(_only(e)).strip().splitlines()
    return lines[-1] if lines else type(e).__name__


class Capture:
    def __enter__(self):
        self.buf = io.StringIO()
        self.old = sys.stdout, sys.stderr
        sys.stdout = sys.stderr = self.buf
        return self

    def __exit__(self, *exc):
        sys.stdout, sys.stderr = self.old
        return False

    def lines(self):
        text = self.buf.getvalue()
        if not text:
            return []
        out = text.split("\n")
        if out[-1] == "":
            out.pop()
        return out[:MAX_LINES]


def new_ns(setup=None):
    ns = {"__name__": "__main__"}
    if setup:
        exec(compile(setup, "<setup>", "exec"), ns)
    return ns


def silent(node):
    """An expression statement whose value a script would throw away."""
    if not isinstance(node, ast.Expr):
        return False
    v = node.value
    if isinstance(v, ast.Call):
        if isinstance(v.func, ast.Attribute):
            return False
        if isinstance(v.func, ast.Name) and v.func.id == "print":
            return False
    return True


# ---------- which boxes did a line touch? ----------

DRAWN = (list, tuple, dict)


def _ev(node, ns):
    return eval(compile(ast.Expression(node), "<peek>", "eval"), dict(ns))


def _idx(node, ns, n):
    try:
        i = _ev(node, ns)
    except Exception:
        return None
    if not isinstance(i, int) or isinstance(i, bool):
        return None
    k = i + n if i < 0 else i
    return k if 0 <= k < n else None


def _pos(node, ns, seq):
    """Which box a subscript points at: the index for a list/tuple, the key's place for a dict."""
    if isinstance(seq, dict):
        try:
            return list(seq).index(_ev(node, ns))
        except Exception:
            return None
    return _idx(node, ns, len(seq))


def _at(seq, i):
    return list(seq.values())[i] if isinstance(seq, dict) else seq[i]


def touched(e, ns, vars):
    if isinstance(e, ast.Call) and isinstance(e.func, ast.Name) and e.func.id == "print" and len(e.args) == 1:
        e = e.args[0]
    for var in vars:
        hl = _touched(e, ns, var)
        if hl:
            hl["var"] = var
            return hl
    return None


def _touched(e, ns, var):
    seq = ns.get(var)
    if not isinstance(seq, DRAWN):
        return None
    n = len(seq)

    def is_var(x):
        return isinstance(x, ast.Name) and x.id == var

    if isinstance(e, ast.Subscript) and is_var(e.value):
        if isinstance(e.slice, ast.Slice):
            if isinstance(seq, dict):
                return None
            s = e.slice
            try:
                a, b, c = [None if x is None else _ev(x, ns) for x in (s.lower, s.upper, s.step)]
                start, stop, step = slice(a, b, c).indices(n)
            except Exception:
                return None
            idxs = list(range(start, stop, step))
            return {"idxs": idxs, "slice": True, "fence": max(stop, start) if step == 1 else None}
        k = _pos(e.slice, ns, seq)
        return {"idxs": [k]} if k is not None else None
    if (isinstance(e, ast.Subscript) and isinstance(e.value, ast.Subscript)
            and is_var(e.value.value) and not isinstance(e.value.slice, ast.Slice)):
        i = _pos(e.value.slice, ns, seq)
        if i is None:
            return None
        inner, j = _at(seq, i), None
        if isinstance(inner, (list, tuple)) and not isinstance(e.slice, ast.Slice):
            j = _idx(e.slice, ns, len(inner))
        return {"idxs": [i], "inner": j}
    if (isinstance(e, ast.Call) and isinstance(e.func, ast.Attribute) and e.func.attr == "get"
            and is_var(e.func.value) and isinstance(seq, dict) and e.args):
        k = _pos(e.args[0], ns, seq)
        return {"idxs": [k]} if k is not None else None
    if isinstance(e, ast.Call) and isinstance(e.func, ast.Name) and e.func.id == "len" and len(e.args) == 1:
        if is_var(e.args[0]):
            return {"idxs": list(range(n))}
        a = e.args[0]
        if isinstance(a, ast.Subscript) and is_var(a.value) and not isinstance(a.slice, ast.Slice):
            k = _pos(a.slice, ns, seq)
            return {"idxs": [k]} if k is not None else None
    return None


def before_change(tree, ns, vars):
    if len(tree.body) != 1:
        return None
    for var in vars:
        pre = _before(tree.body[0], ns, var)
        if pre:
            pre["var"] = var
            return pre
    return None


def _before(st, ns, var):
    seq = ns.get(var)
    if not isinstance(seq, DRAWN):
        return None

    def is_var(x):
        return isinstance(x, ast.Name) and x.id == var

    if isinstance(st, ast.Expr) and isinstance(st.value, ast.Call) and isinstance(st.value.func, ast.Attribute):
        obj = st.value.func.value
        if is_var(obj):
            return {"kind": "method", "len": len(seq)}
        # teams['red'].append('Zoe'): a method on the list inside one box
        if isinstance(obj, ast.Subscript) and is_var(obj.value) and not isinstance(obj.slice, ast.Slice):
            k = _pos(obj.slice, ns, seq)
            if k is not None:
                return {"kind": "inner", "idx": k}
        return None
    if isinstance(st, ast.Assign) and len(st.targets) == 1:
        kind, tgt = "assign", st.targets[0]
    elif isinstance(st, ast.AugAssign):
        kind, tgt = "assign", st.target
    elif isinstance(st, ast.Delete) and len(st.targets) == 1:
        kind, tgt = "del", st.targets[0]
    else:
        return None
    if not (isinstance(tgt, ast.Subscript) and is_var(tgt.value) and not isinstance(tgt.slice, ast.Slice)):
        return None
    k = _pos(tgt.slice, ns, seq)
    if k is not None:
        return {"kind": kind, "idx": k}
    if isinstance(seq, dict) and kind == "assign":
        return {"kind": "add"}  # a new key goes on the end
    return None


def state(ns, vars):
    return {v: {"exists": v in ns, "value": simple(ns[v]) if v in ns else None} for v in vars}


# ---------- the >>> prompt under each picture ----------

def shell(qid, src, var, setup, reset=False, vars=None):
    vars = vars or [var]
    if reset or qid not in SHELLS:
        SHELLS[qid] = new_ns(setup)
    ns = SHELLS[qid]
    src = src.strip()
    if not src:
        return {"lines": [], "hl": None, "state": state(ns, vars)}
    register(SHELL, src)
    lines = []
    try:
        tree = ast.parse(src, SHELL)
    except SyntaxError as e:
        return {"lines": [["err", last_line(e)]], "hl": None, "state": state(ns, vars)}
    pre = before_change(tree, ns, vars)
    hl = None
    try:
        for node in tree.body:
            with Capture() as cap:
                if isinstance(node, ast.Expr):
                    value = eval(compile(ast.Expression(node.value), SHELL, "eval"), ns)
                else:
                    value = None
                    exec(compile(ast.Module(body=[node], type_ignores=[]), SHELL, "exec"), ns)
            lines += [["out", x] for x in cap.lines()]
            if value is not None:
                lines.append(["out", repr(value)])
            if isinstance(node, ast.Assert):
                lines.append(["note", "assert passed"])
            if isinstance(node, ast.Expr):
                hl = touched(node.value, ns, vars) or hl
    except BaseException as e:  # noqa: BLE001 - show every error to the student
        lines += [["out", x] for x in cap.lines()]
        lines.append(["err", last_line(e)])
        if pre and "idx" in pre:
            hl = {"var": pre["var"], "idxs": [pre["idx"]], "fx": "shake"}
    else:
        seq = ns.get(pre["var"]) if pre else None
        if pre and pre["kind"] in ("assign", "inner"):
            hl = {"var": pre["var"], "idxs": [pre["idx"]], "fx": "pop"}
        elif pre and pre["kind"] == "add" and isinstance(seq, dict) and seq:
            hl = {"var": pre["var"], "idxs": [len(seq) - 1], "fx": "pop"}
        elif pre and pre["kind"] == "del" and isinstance(seq, list):
            hl = {"var": pre["var"], "idxs": [], "from": pre["idx"]}
        elif pre and pre["kind"] == "method":
            if isinstance(seq, (list, dict)) and len(seq) > pre["len"]:
                hl = {"var": pre["var"], "idxs": [len(seq) - 1], "fx": "pop"}
    return {"lines": lines, "hl": hl, "state": state(ns, vars)}


# ---------- homework.py ----------

def _run_node(node, ns):
    entry = {"line": node.lineno, "end": node.end_lineno, "out": [], "silent": silent(node)}
    try:
        with Capture() as cap:
            exec(compile(ast.Module(body=[node], type_ignores=[]), SCRIPT, "exec"), ns)
    except BaseException as e:  # noqa: BLE001
        entry["error"] = fmt_exc(e, SCRIPT)
    entry["out"] = cap.lines()
    return entry


# ---------- if / elif / else ----------

def _arms(node):
    """An if/elif/.../else chain: the if and elif nodes in order, and the else body."""
    arms = [node]
    while (len(node.orelse) == 1 and isinstance(node.orelse[0], ast.If)
           and node.orelse[0].col_offset == node.col_offset):  # elif, not else: + an indented if
        node = node.orelse[0]
        arms.append(node)
    return arms, node.orelse


def _ops(arms):
    """The and/or and comparison operators used in a chain's conditions."""
    ops = set()
    for a in arms:
        for n in ast.walk(a.test):
            if isinstance(n, ast.BoolOp):
                ops.add("and" if isinstance(n.op, ast.And) else "or")
            elif isinstance(n, ast.Compare):
                ops.update(type(o).__name__ for o in n.ops)
    return sorted(ops)


def _input_names(tree):
    """Top-level names that get their value from input(), like height = int(input(...))."""
    names = set()
    for n in tree.body:
        if isinstance(n, ast.Assign) and any(
                isinstance(c, ast.Call) and isinstance(c.func, ast.Name) and c.func.id == "input"
                for c in ast.walk(n.value)):
            names.update(t.id for t in n.targets if isinstance(t, ast.Name))
    return names


def branches(tree, ns, var, values):
    """Run each top-level if statement on its own, once per test value of var.
    Grading uses this, so a condition is checked at every edge (119, 120, 200, 201…)
    and a later height = 130 in the script can't hide what an if does."""
    global INPUTS
    names = {var} | _input_names(tree)
    found = []
    for node in tree.body:
        if not isinstance(node, ast.If):
            continue
        arms, else_body = _arms(node)
        code = compile(ast.Module(body=[node], type_ignores=[]), SCRIPT, "exec")
        outs = []
        for lit in values:
            v = eval(lit, {})
            scratch = dict(ns)
            scratch.update({n: v for n in names})
            INPUTS = [str(v)] * 5
            try:
                with Capture() as cap:
                    exec(code, scratch)
                outs.append(cap.lines())
            except BaseException:  # noqa: BLE001 - an error means this value fails
                outs.append(None)
            finally:
                INPUTS = None
        found.append({"line": node.lineno, "end": node.end_lineno, "outs": outs,
                      "ops": _ops(arms), "elifs": len(arms) - 1, "else": bool(else_body)})
    return found


def flow(src, var, values, setup=None):
    """For the picture: which branch of an if/elif/else chain runs for each value,
    what each condition gave on the way, and what the branch printed."""
    try:
        tree = ast.parse(src, "<flow>")
    except SyntaxError as e:
        return {"error": last_line(e)}
    node = next((n for n in tree.body if isinstance(n, ast.If)), None)
    if node is None:
        return {"error": "There is no if statement here."}
    arms, else_body = _arms(node)
    tests = [compile(ast.Expression(a.test), "<flow>", "eval") for a in arms]
    bodies = [compile(ast.Module(body=a.body, type_ignores=[]), "<flow>", "exec") for a in arms]
    else_code = compile(ast.Module(body=else_body, type_ignores=[]), "<flow>", "exec") if else_body else None
    base = new_ns(setup)
    runs = []
    for lit in values:
        ns = dict(base)
        ns[var] = eval(lit, {})
        r = {"tests": [], "branch": -1}
        with Capture() as cap:
            try:
                for k, t in enumerate(tests):
                    got = eval(t, ns)
                    # keep the raw value when it isn't True/False: age == 13 or 14 gives 14
                    r["tests"].append([bool(got), None if isinstance(got, bool) else repr(got)])
                    if got:
                        r["branch"] = k
                        exec(bodies[k], ns)
                        break
                else:
                    if else_code:
                        r["branch"] = len(arms)
                        exec(else_code, ns)
            except BaseException as e:  # noqa: BLE001
                r["error"] = last_line(e)
        r["out"] = cap.lines()
        runs.append(r)
    return {"arms": [{"line": a.lineno, "body": [a.body[0].lineno, a.body[-1].end_lineno]} for a in arms],
            "else": [else_body[0].lineno, else_body[-1].end_lineno] if else_body else None,
            "runs": runs}


def finals(ns, vars):
    return ({v: simple(ns[v]) for v in vars if v in ns},
            {v: repr(ns[v]) for v in vars if v in ns})


def run(src, var, vars=None, inputs=None, probe=None):
    """inputs: answers for input(), in order (None = input() isn't offered).
    probe: {var, values} = also report what each if statement does for those values."""
    global INPUTS
    register(SCRIPT, src)
    try:
        tree = ast.parse(src, SCRIPT)
    except SyntaxError as e:
        return {"syntax": fmt_exc(e, SCRIPT), "entries": [], "outputs": [], "final": None}
    ns = new_ns()
    entries, outputs = [], []
    INPUTS = None if inputs is None else list(inputs)
    try:
        for node in tree.body:
            entry = _run_node(node, ns)
            entries.append(entry)
            outputs += entry["out"]
            if "error" in entry:
                break
    finally:
        INPUTS = None
    final = ns.get(var)
    vals, reprs = finals(ns, vars or [var])
    res = {"entries": entries, "outputs": outputs[:MAX_LINES],
           "final": simple(final) if var in ns else None,
           "final_repr": repr(final) if var in ns else None,
           "finals": vals, "final_reprs": reprs}
    if probe:
        res["probe"] = branches(tree, ns, probe["var"], probe["values"])
    return res


def step(qid, src, var, restart=False, vars=None, inputs=None):
    global INPUTS
    st = STEPS.get(qid)
    if restart or st is None or st["src"] != src or st["done"]:
        register(SCRIPT, src)
        try:
            tree = ast.parse(src, SCRIPT)
        except SyntaxError as e:
            STEPS.pop(qid, None)
            return {"syntax": fmt_exc(e, SCRIPT)}
        st = STEPS[qid] = {"src": src, "nodes": tree.body, "i": 0, "ns": new_ns(), "outputs": [], "done": False,
                           "inputs": None if inputs is None else list(inputs)}
    if st["i"] >= len(st["nodes"]):
        st["done"] = True
        return {"entry": None, "done": True, "outputs": st["outputs"], "final": simple(st["ns"].get(var)) if var in st["ns"] else None,
                "finals": finals(st["ns"], vars or [var])[0]}
    INPUTS = st["inputs"]  # the same list each step, so answers are used up in order
    try:
        entry = _run_node(st["nodes"][st["i"]], st["ns"])
    finally:
        INPUTS = None
    st["i"] += 1
    st["outputs"] += entry["out"]
    st["done"] = "error" in entry or st["i"] >= len(st["nodes"])
    nxt = None if st["done"] else st["nodes"][st["i"]].lineno
    ns = st["ns"]
    return {"entry": entry, "next": nxt, "done": st["done"], "errored": "error" in entry,
            "outputs": st["outputs"], "final": simple(ns.get(var)) if var in ns else None,
            "finals": finals(ns, vars or [var])[0]}


# ---------- assert practice cells ----------

def cells(setup, var, specs, vars=None):
    vars = vars or [var]
    ns = new_ns(setup)
    out, blocked = [], None
    for k, s in enumerate(specs):
        kind = s.get("kind")
        if kind is None:
            out.append(None)
            continue
        inp = (s.get("input") or "").strip()
        if kind == "prog":
            out.append(_prog_cell(inp, s, ns) if inp else {"state": "empty"})
            continue
        if blocked is not None:
            out.append({"state": "blocked", "blocked_by": blocked, "has_input": bool(inp)})
            continue
        if not inp or s.get("skip"):
            out.append({"state": "skip" if inp else "empty"})
            if kind == "stmt":
                blocked = k
            continue
        register(CELL, inp)
        if kind == "stmt":
            try:
                with Capture() as cap:
                    exec(compile(inp, CELL, "exec"), ns)
            except BaseException as e:  # noqa: BLE001
                out.append({"state": "fail", "printed": cap.lines(), "error": last_line(e)})
                blocked = k
                continue
            failed = None
            for a in s.get("asserts", []):
                try:
                    ok = bool(eval(a, dict(ns)))
                except Exception:  # noqa: BLE001
                    ok = False
                if not ok:
                    failed = a
                    break
            out.append({"state": "fail" if failed else "pass", "printed": cap.lines(),
                        "assert_failed": bool(failed), "now": {v: repr(ns.get(v)) for v in vars}})
            if failed:
                blocked = k
            continue
        try:
            tree = ast.parse(inp, CELL, mode="eval")
        except SyntaxError as e:
            try:
                ast.parse(inp, CELL, mode="exec")
                is_stmt = True
            except SyntaxError:
                is_stmt = False
            out.append({"state": "fail", "error": last_line(e), "not_expr": is_stmt})
            continue
        scratch = {key: copy.deepcopy(v) for key, v in ns.items() if key != "__builtins__"}
        try:
            with Capture() as cap:
                value = eval(compile(tree, CELL, "eval"), scratch)
        except BaseException as e:  # noqa: BLE001
            out.append({"state": "fail", "printed": cap.lines(), "error": last_line(e)})
            continue
        want = eval(s["expect"], {})
        body = tree.body
        is_print = isinstance(body, ast.Call) and isinstance(body.func, ast.Name) and body.func.id == "print"
        printed = cap.lines()
        if is_print:
            # print(x) passes when it shows exactly what print(<answer>) would show
            good = printed == [str(want)]
            shown = printed
        else:
            good = value == want
            shown = printed + ([repr(value)] if value is not None else [])
        out.append({"state": "pass" if good else "fail", "shown": shown, "assert_failed": not good})
    return out


def _said(lines):
    """What some print() calls showed, compared loosely: case, spacing and curly quotes don't matter."""
    s = " ".join(lines).lower().replace("\u2018", "'").replace("\u2019", "'").replace("\u201c", '"').replace("\u201d", '"')
    return " ".join(s.split())


def _prog_cell(inp, s, ns):
    """A code box: run the student's few lines once for every test value of var.
    s["want"] is only what should be printed for each value (the task text says it),
    so the page never holds the answer's code."""
    global INPUTS
    try:
        code = compile(inp, CELL, "exec")
    except SyntaxError as e:
        return {"state": "fail", "error": last_line(e)}
    register(CELL, inp)
    for lit, want in zip(s["values"], s["want"]):
        v = eval(lit, {})
        scratch = {key: copy.deepcopy(x) for key, x in ns.items() if key != "__builtins__"}
        scratch[s["var"]] = v
        INPUTS = [str(v)] * 5
        try:
            with Capture() as cap:
                exec(code, scratch)
        except BaseException as e:  # noqa: BLE001
            return {"state": "fail", "v": repr(v), "printed": cap.lines(), "error": last_line(e)}
        finally:
            INPUTS = None
        if _said(cap.lines()) != _said([want]):
            return {"state": "fail", "v": repr(v), "printed": cap.lines(), "want": want, "assert_failed": True}
    return {"state": "pass"}


def peek(qid, expr, var, setup):
    if qid not in SHELLS:
        SHELLS[qid] = new_ns(setup)
    try:
        return {"repr": repr(eval(expr, dict(SHELLS[qid])))}
    except Exception as e:  # noqa: BLE001
        return {"error": last_line(e)}


FUNCS = {"shell": shell, "run": run, "step": step, "cells": cells, "peek": peek, "flow": flow}


def dispatch(fn, args_json):
    return json.dumps(FUNCS[fn](**json.loads(args_json)))
