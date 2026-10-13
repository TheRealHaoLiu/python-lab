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


def _no_input(*_args, **_kwargs):
    raise RuntimeError("input() doesn't work on this page. Put the value straight into your code instead.")


builtins.input = _no_input


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


def touched(e, ns, var):
    if isinstance(e, ast.Call) and isinstance(e.func, ast.Name) and e.func.id == "print" and len(e.args) == 1:
        e = e.args[0]
    seq = ns.get(var)
    if not isinstance(seq, (list, tuple)):
        return None
    n = len(seq)

    def is_var(x):
        return isinstance(x, ast.Name) and x.id == var

    if isinstance(e, ast.Subscript) and is_var(e.value):
        if isinstance(e.slice, ast.Slice):
            s = e.slice
            try:
                a, b, c = [None if x is None else _ev(x, ns) for x in (s.lower, s.upper, s.step)]
                start, stop, step = slice(a, b, c).indices(n)
            except Exception:
                return None
            idxs = list(range(start, stop, step))
            return {"idxs": idxs, "slice": True, "fence": max(stop, start) if step == 1 else None}
        k = _idx(e.slice, ns, n)
        return {"idxs": [k]} if k is not None else None
    if (isinstance(e, ast.Subscript) and isinstance(e.value, ast.Subscript)
            and is_var(e.value.value) and not isinstance(e.value.slice, ast.Slice)):
        i = _idx(e.value.slice, ns, n)
        if i is None:
            return None
        inner, j = seq[i], None
        if isinstance(inner, (list, tuple)) and not isinstance(e.slice, ast.Slice):
            j = _idx(e.slice, ns, len(inner))
        return {"idxs": [i], "inner": j}
    if isinstance(e, ast.Call) and isinstance(e.func, ast.Name) and e.func.id == "len" and len(e.args) == 1 and is_var(e.args[0]):
        return {"idxs": list(range(n))}
    return None


def before_change(tree, ns, var):
    if len(tree.body) != 1:
        return None
    st = tree.body[0]
    seq = ns.get(var)
    if not isinstance(seq, (list, tuple)):
        return None
    if (isinstance(st, ast.Expr) and isinstance(st.value, ast.Call) and isinstance(st.value.func, ast.Attribute)
            and isinstance(st.value.func.value, ast.Name) and st.value.func.value.id == var):
        return {"kind": "method", "len": len(seq)}
    if isinstance(st, ast.Assign) and len(st.targets) == 1:
        kind, tgt = "assign", st.targets[0]
    elif isinstance(st, ast.Delete) and len(st.targets) == 1:
        kind, tgt = "del", st.targets[0]
    else:
        return None
    if (isinstance(tgt, ast.Subscript) and isinstance(tgt.value, ast.Name) and tgt.value.id == var
            and not isinstance(tgt.slice, ast.Slice)):
        k = _idx(tgt.slice, ns, len(seq))
        if k is not None:
            return {"kind": kind, "idx": k}
    return None


def state(ns, var):
    return {"exists": var in ns, "value": simple(ns[var]) if var in ns else None}


# ---------- the >>> prompt under each picture ----------

def shell(qid, src, var, setup, reset=False):
    if reset or qid not in SHELLS:
        SHELLS[qid] = new_ns(setup)
    ns = SHELLS[qid]
    src = src.strip()
    if not src:
        return {"lines": [], "hl": None, "state": state(ns, var)}
    register(SHELL, src)
    lines = []
    try:
        tree = ast.parse(src, SHELL)
    except SyntaxError as e:
        return {"lines": [["err", last_line(e)]], "hl": None, "state": state(ns, var)}
    pre = before_change(tree, ns, var)
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
                hl = touched(node.value, ns, var) or hl
    except BaseException as e:  # noqa: BLE001 - show every error to the student
        lines += [["out", x] for x in cap.lines()]
        lines.append(["err", last_line(e)])
        if pre and "idx" in pre:
            hl = {"idxs": [pre["idx"]], "fx": "shake"}
    else:
        if pre and pre["kind"] == "assign":
            hl = {"idxs": [pre["idx"]], "fx": "pop"}
        elif pre and pre["kind"] == "del":
            hl = {"idxs": [], "from": pre["idx"]}
        elif pre and pre["kind"] == "method":
            seq = ns.get(var)
            if isinstance(seq, list) and len(seq) > pre["len"]:
                hl = {"idxs": [len(seq) - 1], "fx": "pop"}
    return {"lines": lines, "hl": hl, "state": state(ns, var)}


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


def run(src, var):
    register(SCRIPT, src)
    try:
        tree = ast.parse(src, SCRIPT)
    except SyntaxError as e:
        return {"syntax": fmt_exc(e, SCRIPT), "entries": [], "outputs": [], "final": None}
    ns = new_ns()
    entries, outputs = [], []
    for node in tree.body:
        entry = _run_node(node, ns)
        entries.append(entry)
        outputs += entry["out"]
        if "error" in entry:
            break
    final = ns.get(var)
    return {"entries": entries, "outputs": outputs[:MAX_LINES],
            "final": simple(final) if var in ns else None,
            "final_repr": repr(final) if var in ns else None}


def step(qid, src, var, restart=False):
    st = STEPS.get(qid)
    if restart or st is None or st["src"] != src or st["done"]:
        register(SCRIPT, src)
        try:
            tree = ast.parse(src, SCRIPT)
        except SyntaxError as e:
            STEPS.pop(qid, None)
            return {"syntax": fmt_exc(e, SCRIPT)}
        st = STEPS[qid] = {"src": src, "nodes": tree.body, "i": 0, "ns": new_ns(), "outputs": [], "done": False}
    if st["i"] >= len(st["nodes"]):
        st["done"] = True
        return {"entry": None, "done": True, "outputs": st["outputs"], "final": simple(st["ns"].get(var)) if var in st["ns"] else None}
    entry = _run_node(st["nodes"][st["i"]], st["ns"])
    st["i"] += 1
    st["outputs"] += entry["out"]
    st["done"] = "error" in entry or st["i"] >= len(st["nodes"])
    nxt = None if st["done"] else st["nodes"][st["i"]].lineno
    ns = st["ns"]
    return {"entry": entry, "next": nxt, "done": st["done"], "errored": "error" in entry,
            "outputs": st["outputs"], "final": simple(ns.get(var)) if var in ns else None}


# ---------- assert practice cells ----------

def cells(setup, var, specs):
    ns = new_ns(setup)
    out, blocked = [], None
    for k, s in enumerate(specs):
        kind = s.get("kind")
        if kind is None:
            out.append(None)
            continue
        inp = (s.get("input") or "").strip()
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
                        "assert_failed": bool(failed), "now": repr(ns.get(var))})
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


def peek(qid, expr, var, setup):
    if qid not in SHELLS:
        SHELLS[qid] = new_ns(setup)
    try:
        return {"repr": repr(eval(expr, dict(SHELLS[qid])))}
    except Exception as e:  # noqa: BLE001
        return {"error": last_line(e)}


FUNCS = {"shell": shell, "run": run, "step": step, "cells": cells, "peek": peek}


def dispatch(fn, args_json):
    return json.dumps(FUNCS[fn](**json.loads(args_json)))
