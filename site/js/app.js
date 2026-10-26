/* Lab page UI. All Python runs in js/py-worker.js (real CPython on Pyodide);
   this file draws the pictures, the editors and the checks, and grades. */
'use strict';
// Site root = the folder above js/, so homework pages in subfolders find shared files.
const SITE = new URL('..', document.currentScript.src);
// Deploy stamps ?v=<commit> on script links; pass it on so browsers never mix old and new files.
const BUILD = new URL(document.currentScript.src).searchParams.get('v') || 'dev';
const withBuild = u => { const x = new URL(u, SITE); x.searchParams.set('v', BUILD); return x.href; };
const CFG = Object.assign({ pyodide: 'vendor/pyodide/', timeoutMs: 5000 }, window.LAB_CONFIG || {});
const QS = window.LESSON.questions;
QS.forEach(q => { q.vars = q.vars || [q.var]; });  // the variables a question draws; q.var is the main one
const LESSON_ID = window.LESSON.id || 'lesson';

/* ---------- small helpers ---------- */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k) { try { return localStorage.getItem(`pylab:v1:${LESSON_ID}:` + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(`pylab:v1:${LESSON_ID}:` + k, v); } catch (e) { /* private mode */ } },
};
const plain = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent; };
const S = {};
const WHY_RE = /typeerror|immutable|error|can'?t|cannot|can not|not support|unchang|not allowed/;

/* Python-style repr of the plain values the worker sends back (for drawing only). */
function repr(v) {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'True' : 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') {
    const q = v.includes("'") && !v.includes('"') ? '"' : "'";
    let s = v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
    if (q === "'") s = s.replace(/'/g, "\\'");
    return q + s + q;
  }
  if (v.t === 'tuple') return v.items.length === 1 ? '(' + repr(v.items[0]) + ',)' : '(' + v.items.map(repr).join(', ') + ')';
  if (v.t === 'list') return '[' + v.items.map(repr).join(', ') + ']';
  if (v.t === 'dict') return '{' + v.items.map(([k, x]) => repr(k) + ': ' + repr(x)).join(', ') + '}';
  if (v.t === 'other') return v.r;
  return String(v);
}
const display = v => typeof v === 'string' ? v : repr(v);
function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; }
    else if (c === "'" || c === '"') q = c;
    else if (c === '#') return line.slice(0, i);
  }
  return line;
}
const commentText = line => { const code = stripComment(line); return line.length > code.length ? line.slice(code.length + 1).trim() : ''; };

/* ---------- syntax colouring ---------- */
const PY_KW = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
const PY_BUILTINS = ['print', 'len', 'type', 'str', 'int', 'float', 'bool', 'list', 'tuple', 'dict', 'set', 'range', 'sorted', 'reversed', 'min', 'max', 'sum', 'abs', 'round', 'enumerate', 'zip', 'input', 'isinstance'];
const BUILTIN_SET = new Set(PY_BUILTINS);
const METHODS = {
  list: ['append', 'clear', 'copy', 'count', 'extend', 'index', 'insert', 'pop', 'remove', 'reverse', 'sort'],
  tuple: ['count', 'index'],
  dict: ['clear', 'copy', 'get', 'items', 'keys', 'pop', 'popitem', 'setdefault', 'update', 'values'],
  str: ['capitalize', 'count', 'endswith', 'find', 'join', 'lower', 'replace', 'split', 'startswith', 'strip', 'title', 'upper'],
};
function hl(src) {
  let out = '', i = 0; const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '#') { let j = src.indexOf('\n', i); if (j < 0) j = n; out += `<span class="h-c">${esc(src.slice(i, j))}</span>`; i = j; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < n && src[j] !== c && src[j] !== '\n') { if (src[j] === '\\') j++; j++; } if (j < n && src[j] === c) j++; out += `<span class="h-s">${esc(src.slice(i, j))}</span>`; i = j; continue; }
    if (/[0-9]/.test(c) && !/\w/.test(src[i - 1] || '')) { let j = i; while (j < n && /[\w.]/.test(src[j])) j++; out += `<span class="h-n">${esc(src.slice(i, j))}</span>`; i = j; continue; }
    if (/[A-Za-z_]/.test(c)) {
      let j = i; while (j < n && /\w/.test(src[j])) j++;
      const w = src.slice(i, j), dot = src[i - 1] === '.';
      const cls = (w === 'True' || w === 'False' || w === 'None') ? 'h-n' : PY_KW.has(w) ? 'h-k' : dot ? 'h-m' : BUILTIN_SET.has(w) ? 'h-f' : '';
      out += cls ? `<span class="${cls}">${w}</span>` : w; i = j; continue;
    }
    out += esc(c); i++;
  }
  return out;
}

/* ---------- the Python worker ---------- */
const Py = (() => {
  let worker = null, ready = false, seq = 0, version = '', restarts = 0;
  const pending = new Map(), listeners = new Set();
  const emit = (s, d) => listeners.forEach(f => f(s, d));
  let workerSrc = null;
  async function start() {
    ready = false; emit('loading');
    // Start the worker from a blob: URL so it inherits this page's Content-Security-Policy
    // (a worker loaded from its own file would get no policy on GitHub Pages).
    if (!workerSrc) {
      const boot = { pyodide: new URL(CFG.pyodide, SITE).href, labkit: withBuild('py/labkit.py') };
      const src = await (await fetch(withBuild('js/py-worker.js'))).text();
      workerSrc = URL.createObjectURL(new Blob([`self.LAB_BOOT = ${JSON.stringify(boot)};\n`, src], { type: 'text/javascript' }));
    }
    worker = new Worker(workerSrc);
    worker.onmessage = e => {
      const m = e.data;
      if (m.type === 'ready') { ready = true; version = m.version; emit('ready', { version, restarted: restarts > 0 }); for (const p of pending.values()) arm(p); return; }
      if (m.type === 'fatal') { emit('error', m.error); for (const p of pending.values()) { clearTimeout(p.timer); p.reject({ fatal: true, message: m.error }); } pending.clear(); return; }
      const p = pending.get(m.id); if (!p) return;
      pending.delete(m.id); clearTimeout(p.timer);
      m.ok ? p.resolve(m.result) : p.reject({ message: m.error });
    };
    worker.onerror = e => emit('error', e.message || 'the Python worker failed to start');
  }
  function arm(p) { if (!p.timer) p.timer = setTimeout(stop, CFG.timeoutMs); }
  function stop() {
    worker.terminate(); worker = null; restarts++;
    const msg = `Stopped after ${CFG.timeoutMs / 1000} seconds. Is there a loop that never ends? Python is restarting.`;
    for (const p of pending.values()) { clearTimeout(p.timer); p.reject({ timeout: true, message: msg }); }
    pending.clear(); start();
  }
  function call(fn, args) {
    return new Promise((resolve, reject) => {
      const id = ++seq, p = { id, resolve, reject, timer: null };
      pending.set(id, p); if (ready) arm(p);
      (function send() { if (worker) worker.postMessage({ id, fn, args }); else setTimeout(send, 50); })();
    });
  }
  return { start, call, on: f => listeners.add(f), get ready() { return ready; } };
})();
const failText = e => e && (e.timeout || e.fatal) ? e.message : 'Python could not run this: ' + (e && e.message || e);

/* ---------- picture ---------- */
const BRK = { list: '[]', tuple: '()', dict: '{}' };
// The main variable's picture is data-row="q1"; any other variable's is data-row="q1:name".
const rowKey = (q, name) => name === q.var ? q.id : `${q.id}:${name}`;
function initVals(q) {
  const r = q.init(), m = q.vars.length > 1 ? r : { [q.var]: r };
  return Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { exists: true, value: v }]));
}
const valOf = (q, name = q.var) => { const c = S[q.id].vals[name]; return c ? c.value : null; };
function renderPicture(q, h) {
  const mine = name => h && (h.var || q.var) === name ? h : null;
  q.vars.forEach(name => { renderRow(q, name, mine(name)); renderVal(q, name); });
  if ($(`[data-map="${q.id}"]`)) renderMap(q, mine(q.var));
  if (q.flow) flowFromShell(q);
}
/* A plain value (None, a string, a number): one box with its type underneath. */
const TYPE = v => v === null ? 'NoneType' : typeof v === 'string' ? 'str' : typeof v === 'number' ? 'int' : typeof v === 'boolean' ? 'bool' : v.t === 'other' ? '' : v.t;
function renderVal(q, name) {
  const el = $(`[data-val="${rowKey(q, name)}"]`); if (!el) return;
  const cur = S[q.id].vals[name] || { exists: false, value: null };
  el.innerHTML = `<span class="var-name">${esc(name)} =</span>` + (cur.exists
    ? `<span class="val-box">${esc(repr(cur.value))}</span><span class="badge">${esc(TYPE(cur.value))}</span>`
    : '<span class="row-empty">deleted. Press “Reset picture”.</span>');
}
function renderRow(q, name, h) {
  const key = rowKey(q, name), row = $(`[data-row="${key}"]`); if (!row) return;
  const cur = S[q.id].vals[name] || { exists: false, value: null }, v = cur.value;
  const kind = v && BRK[v.t] ? v.t : 'tuple';
  $(`[data-open="${key}"]`).textContent = BRK[kind][0];
  $(`[data-close="${key}"]`).textContent = BRK[kind][1];
  // One picture tints its whole bench; with two, each picture keeps its own colour.
  const tint = q.vars.length > 1 ? row.closest('.row-wrap') : row.closest('.bench');
  tint.style.setProperty('--kind', `var(--${kind})`); tint.style.setProperty('--kind-soft', `var(--${kind}-soft)`);
  const badge = $(`[data-badge="${key}"]`), n = v && v.items ? v.items.length : 0;
  if (badge) badge.textContent = !v || !v.items ? '' : kind === 'dict' ? `dict · ${n} key${n === 1 ? '' : 's'} · can change` : kind === 'list' ? `list · ${n} items · can change` : `tuple · ${n} items · sealed`;
  row.className = 'row is-' + kind;
  // a dictionary is drawn like its code: one entry per line between { and }
  row.closest('.row-wrap').classList.toggle('is-dict', kind === 'dict');
  if (!v || !v.items) {
    row.style.setProperty('--n', 1);
    row.innerHTML = `<div class="row-empty">${esc(name)} is now ${esc(cur.exists ? repr(v) : 'deleted')}. Press “Reset picture”.</div>`;
    return;
  }
  row.style.setProperty('--n', Math.max(n, 1));
  if (!n) { row.innerHTML = '<div class="row-empty">empty</div>'; return; }
  row.innerHTML = kind === 'dict' ? dictCells(name, v) : v.items.map((it, i) => {
    const nested = it && it.items;
    const ix = nested ? `<button type="button" class="ix" data-i="${i}" aria-label="${name}[${i}]">${i}</button>` : `<span class="ix">${i}</span>`;
    const box = nested
      ? `<div class="box nested">(${it.items.map((x, j) => `<button type="button" class="mini" data-i="${i}" data-j="${j}" aria-label="${name}[${i}][${j}]">${esc(display(x))}</button>`).join(', ')}${it.items.length === 1 ? ',' : ''})</div>`
      : `<button type="button" class="box" data-i="${i}">${esc(display(it))}</button>`;
    return `<div class="cell" data-cell="${i}">${ix}${box}<span class="nix">${i - n}</span></div>`;
  }).join('');
  if (h) applyHL(q, h);
}
/* A dictionary: a name tag (the key) next to each value, and no index numbers. */
function dictCells(name, v) {
  return v.items.map(([k, x], i) => {
    const kr = esc(repr(k)), seq = x && x.items && x.t !== 'dict';
    const val = seq
      ? `<div class="box nested">${BRK[x.t][0]}${x.items.map((y, j) => `<button type="button" class="mini" data-i="${i}" data-j="${j}" aria-label="${esc(name)}[${kr}][${j}]">${esc(display(y))}</button>`).join(', ')}${BRK[x.t][1]}</div>`
      : `<button type="button" class="box" data-i="${i}" aria-label="${esc(name)}[${kr}]">${esc(display(x))}</button>`;
    return `<div class="cell kv" data-cell="${i}"><button type="button" class="key" data-i="${i}" aria-label="${esc(name)}[${kr}]">${kr}</button><span class="colon" aria-hidden="true">:</span>${val}</div>`;
  }).join('');
}
function applyHL(q, h) {
  const row = $(`[data-row="${rowKey(q, h && h.var || q.var)}"]`); if (!row) return;
  const cells = $$('.cell', row);
  row.classList.toggle('slicing', !!(h && h.slice));
  cells.forEach(c => c.classList.remove('hl', 'fence-before', 'fence-after', 'shake', 'pop', 'slide'));
  $$('.mini', row).forEach(m => m.classList.remove('hl'));
  if (!h) return;
  for (const i of h.idxs || []) if (cells[i]) { cells[i].classList.add('hl'); if (h.fx) cells[i].classList.add(h.fx); }
  if (h.from != null) cells.forEach((c, i) => { if (i >= h.from) c.classList.add('slide'); });
  if (h.inner != null && h.idxs) { const m = $(`.mini[data-i="${h.idxs[0]}"][data-j="${h.inner}"]`, row); if (m) { m.classList.add('hl'); cells[h.idxs[0]].classList.remove('hl'); } }
  if (h.slice && h.fence != null) { if (h.fence < cells.length) cells[h.fence].classList.add('fence-before'); else if (cells.length) cells[cells.length - 1].classList.add('fence-after'); }
}
function renderMap(q, h) {
  const svg = $(`[data-map="${q.id}"]`), v = valOf(q), O = 24, G = 20, B = O + 10 * G;
  const X = x => O + x * G, Y = y => B - y * G, isInt = x => Number.isInteger(x);
  let s = '';
  for (let k = 0; k <= 10; k++) s += `<line class="g" x1="${X(k)}" y1="${O}" x2="${X(k)}" y2="${B}"/><line class="g" x1="${O}" y1="${Y(k)}" x2="${X(10)}" y2="${Y(k)}"/>`;
  s += `<line class="axis" x1="${O}" y1="${B}" x2="${X(10)}" y2="${B}"/><line class="axis" x1="${O}" y1="${O}" x2="${O}" y2="${B}"/>`;
  const sel = h && h.idxs && h.idxs.length === 1 ? h.idxs[0] : null, selSet = new Set(h && h.idxs || []);
  let onX = null, onY = null;
  if (v && v.items) v.items.forEach((p, i) => {
    if (!p || !p.items || p.items.length < 2) return;
    const [x, y] = p.items; if (!isInt(x) || !isInt(y) || x < 0 || x > 10 || y < 0 || y > 10) return;
    if (sel === i && h.inner === 0) { s += `<line class="guide" x1="${X(x)}" y1="${Y(y)}" x2="${X(x)}" y2="${B}"/>`; onX = x; }
    if (sel === i && h.inner === 1) { s += `<line class="guide" x1="${X(x)}" y1="${Y(y)}" x2="${O}" y2="${Y(y)}"/>`; onY = y; }
    s += `<g class="x${selSet.has(i) ? ' sel' : ''}"><circle cx="${X(x)}" cy="${Y(y)}" r="9"/><line x1="${X(x) - 5}" y1="${Y(y) - 5}" x2="${X(x) + 5}" y2="${Y(y) + 5}"/><line x1="${X(x) + 5}" y1="${Y(y) - 5}" x2="${X(x) - 5}" y2="${Y(y) + 5}"/><text x="${X(x) + 9}" y="${Y(y) - 9}">[${i}]</text></g>`;
  });
  for (let k = 0; k <= 10; k++) s += `<text x="${X(k)}" y="${B + 14}" text-anchor="middle" class="${onX === k ? 'on' : ''}">${k}</text><text x="${O - 6}" y="${Y(k) + 3}" text-anchor="end" class="${onY === k ? 'on' : ''}">${k}</text>`;
  s += `<text x="${X(10)}" y="${B + 26}" text-anchor="end">x →</text><text x="${O}" y="${O - 8}" text-anchor="middle">↑ y</text>`;
  svg.innerHTML = s;
}

/* ---------- if / elif / else pictures ----------
   q.flow = {var, min, max, step, start, unit, tick, programs: [{label, code}], tester}.
   Python works out every value at once when a program is picked, so the slider is instant. */
const pyLit = v => v === null ? 'None' : typeof v === 'string' ? JSON.stringify(v) : String(v);
const flowVals = f => { const a = []; for (let v = f.min; v <= f.max; v += f.step || 1) a.push(v); return a; };
function buildFlow(q) {
  const f = q.flow, host = $(`[data-flow="${q.id}"]`); if (!f || !host) return;
  const st = S[q.id], saved = +store.get(q.id + ':fv');
  st.fv = saved >= f.min && saved <= f.max ? saved : f.start; st.prog = 0; st.flowRes = null; st.testRes = null;
  host.innerHTML = `
    <div class="fl-dial">
      <label class="fl-var" for="${q.id}-fv">${esc(f.var)} = <output>${st.fv}</output>${f.unit ? ` <span class="unit">${esc(f.unit)}</span>` : ''}</label>
      <div class="fl-slide"><button type="button" class="btn ghost" data-nudge="-1" aria-label="${esc(f.var)} minus 1">−</button><input type="range" id="${q.id}-fv" min="${f.min}" max="${f.max}" step="${f.step || 1}" value="${st.fv}"><button type="button" class="btn ghost" data-nudge="1" aria-label="${esc(f.var)} plus 1">+</button></div>
    </div>
    <div class="seg fl-progs" role="group" aria-label="Pick a program">${f.programs.map((p, i) => `<button type="button" data-prog="${i}" aria-pressed="${i === 0}">${esc(p.label)}</button>`).join('')}</div>
    <div class="fl-run">
      <div class="fl-code" data-fl-code></div>
      <div class="fl-out"><span class="label">prints</span><div data-fl-out></div></div>
    </div>
    <div class="fl-map"><span class="label">Every ${esc(f.var)} from ${f.min} to ${f.max}: which branch runs?</span><div class="strip" data-strip></div><div class="legend" data-legend></div></div>
    <div class="fl-test">
      <div class="pc"><div class="pc-line"><span class="pr h-k">if</span><div class="pc-in" data-tester></div><span class="pr">:</span><span class="fl-says" data-says></span></div></div>
      <div class="strip tester" data-tstrip></div>
      <p class="tip">Type any condition. Yellow shows every ${esc(f.var)} that makes it <code>True</code>.</p>
    </div>`;
  const range = $('input[type=range]', host);
  const setV = v => { st.fv = Math.min(f.max, Math.max(f.min, v)); range.value = st.fv; store.set(q.id + ':fv', st.fv); paintFlow(q); syncShell(q); };
  range.addEventListener('input', () => setV(+range.value));
  $$('[data-nudge]', host).forEach(b => b.addEventListener('click', () => setV(st.fv + (+b.dataset.nudge) * (f.step || 1))));
  $$('[data-prog]', host).forEach(b => b.addEventListener('click', () => {
    st.prog = +b.dataset.prog; $$('[data-prog]', host).forEach(x => x.setAttribute('aria-pressed', String(x === b))); loadFlow(q);
  }));
  host.addEventListener('click', e => { const c = e.target.closest('.strip i[data-v]'); if (c) setV(+c.dataset.v); });
  st.setFlowV = setV;
  let tt = null;
  st.tester = lineEditor(q, $('[data-tester]', host), {
    initial: store.get(q.id + ':tester') || '', placeholder: f.tester ? `try: ${f.tester}` : 'type a condition', label: `A condition to try for ${f.var}`,
    onEnter: () => loadTester(q),
    onChange: v => { store.set(q.id + ':tester', v); clearTimeout(tt); tt = setTimeout(() => loadTester(q), 350); },
  });
  paintFlow(q);
}
async function loadFlow(q) {
  const f = q.flow, st = S[q.id];
  try { st.flowRes = await Py.call('flow', { src: f.programs[st.prog].code, var: f.var, values: flowVals(f).map(pyLit), setup: q.setup }); }
  catch (e) { st.flowRes = { error: failText(e) }; }
  paintFlow(q);
}
async function loadTester(q) {
  const f = q.flow, st = S[q.id], cond = st.tester.state.doc.toString().trim().replace(/^if\s+/, '').replace(/:\s*$/, '');
  if (!cond) { st.testRes = null; paintFlow(q); return; }
  try { st.testRes = await Py.call('flow', { src: `if ${cond}:\n    pass`, var: f.var, values: flowVals(f).map(pyLit), setup: q.setup }); }
  catch (e) { st.testRes = { error: failText(e) }; }
  paintFlow(q);
}
function stripHTML(f, vals, cls, cur) {
  const few = vals.length <= 24, n = vals.length;
  const cells = vals.map((v, i) => `<i class="${cls(i)}${v === cur ? ' cur' : ''}" data-v="${v}" title="${esc(f.var)} = ${v}">${few ? v : ''}</i>`).join('');
  const ticks = few ? '' : vals.map((v, i) => v % (f.tick || 10) === 0 ? `<b class="${(v / (f.tick || 10)) % 2 ? 'odd' : ''}" style="left:${(i + .5) / n * 100}%">${v}</b>` : '').join('');
  return `<div class="cells">${cells}</div>${ticks ? `<div class="ticks">${ticks}</div>` : ''}`;
}
function paintFlow(q) {
  const f = q.flow, st = S[q.id], host = $(`[data-flow="${q.id}"]`); if (!host) return;
  const vals = flowVals(f), i = vals.indexOf(st.fv);
  $('.fl-var output', host).textContent = st.fv;
  const code = $('[data-fl-code]', host), out = $('[data-fl-out]', host), r = st.flowRes;
  const lines = f.programs[st.prog].code.split('\n');
  if (!r || r.error) {
    code.innerHTML = lines.map((l, k) => `<div class="fl-ln"><span class="fl-no">${k + 1}</span><code>${hl(l)}</code></div>`).join('');
    out.innerHTML = r && r.error ? `<div class="s-err">${esc(r.error)}</div>` : '<div class="s-note">waiting for Python…</div>';
  } else {
    const run = r.runs[i] || { tests: [], branch: -1, out: [] }, arms = r.arms, nArms = arms.length;
    const state = {};  // line number -> 'lit' | 'dim', plus the condition chips
    const chips = {};
    arms.forEach((a, k) => {
      const t = run.tests[k];
      chips[a.line] = t ? `<span class="fl-chip ${t[0] ? 'yes' : 'no'}">→ ${t[1] ? esc(t[1]) + (t[0] ? ' counts as True' : ' counts as False') : t[0] ? 'True' : 'False'}</span>` : '<span class="fl-chip skip">not checked</span>';
      for (let L = a.body[0]; L <= a.body[1]; L++) state[L] = run.branch === k ? 'lit' : 'dim';
      state[a.line] = t ? 'test' : 'dim';
    });
    if (r.else) { const lit = run.branch === nArms; state[r.else[0] - 1] = lit ? 'test' : 'dim'; if (lit) chips[r.else[0] - 1] = '<span class="fl-chip yes">→ none of the above</span>'; for (let L = r.else[0]; L <= r.else[1]; L++) state[L] = lit ? 'lit' : 'dim'; }
    code.innerHTML = lines.map((l, k) => `<div class="fl-ln ${state[k + 1] || ''}"><span class="fl-no">${k + 1}</span><code>${hl(l)}</code>${chips[k + 1] || ''}</div>`).join('');
    out.innerHTML = run.error ? `<div class="s-err">${esc(run.error)}</div>` : run.out.length ? run.out.map(o => `<div class="s-out">${esc(o)}</div>`).join('') : '<div class="s-note">(nothing printed)</div>';
    const bcls = k => { const b = r.runs[k].branch; return b < 0 ? 'bn' : b === nArms ? 'be' : 'b' + (b % 4); };
    $('[data-strip]', host).innerHTML = stripHTML(f, vals, bcls, st.fv);
    const seen = new Map();
    r.runs.forEach(x => { if (!seen.has(x.branch)) seen.set(x.branch, x.out.join(' ') || '(nothing printed)'); });
    $('[data-legend]', host).innerHTML = [...seen.keys()].sort((a, b) => (a < 0) - (b < 0) || a - b)
      .map(b => `<span><i class="${b < 0 ? 'bn' : b === nArms ? 'be' : 'b' + (b % 4)}"></i>${b < 0 ? 'nothing runs' : b === nArms ? 'else' : (b === 0 ? 'if' : 'elif') + ` (line ${arms[b].line})`}: ${esc(seen.get(b))}</span>`).join('');
  }
  const t = st.testRes, says = $('[data-says]', host), ts = $('[data-tstrip]', host);
  if (!t) { says.innerHTML = ''; ts.innerHTML = ''; ts.hidden = true; return; }
  ts.hidden = false;
  if (t.error) { says.innerHTML = `<span class="s-err">${esc(t.error)}</span>`; ts.innerHTML = ''; return; }
  const tr = t.runs[i], tv = tr && tr.tests[0];
  says.innerHTML = tr && tr.error ? `<span class="s-err">${esc(tr.error)}</span>` : tv ? `<span class="fl-chip ${tv[0] ? 'yes' : 'no'}">${esc(f.var)} = ${st.fv} → ${tv[1] ? esc(tv[1]) + ', which counts as ' + (tv[0] ? 'True' : 'False') : tv[0] ? 'True' : 'False'}</span>` : '';
  ts.innerHTML = stripHTML(f, vals, k => t.runs[k].error ? 'berr' : t.runs[k].branch === 0 ? 'bt' : 'bf', st.fv);
}
let shellSync = null;
function syncShell(q) {
  // keep the >>> prompt's variable in step with the slider (quietly, no log line)
  clearTimeout(shellSync);
  shellSync = setTimeout(async () => {
    try { const r = await Py.call('shell', { qid: q.id, src: `${q.flow.var} = ${S[q.id].fv}`, var: q.var, vars: q.vars, setup: q.setup }); S[q.id].vals = r.state; } catch (e) { /* restarting */ }
  }, 200);
}
function flowFromShell(q) {
  // typed height = 150 at the >>> prompt: move the slider there
  const st = S[q.id], c = st.vals[q.flow.var], v = c && c.value;
  if (st.setFlowV && Number.isInteger(v) && v !== st.fv && v >= q.flow.min && v <= q.flow.max) {
    st.fv = v; const range = $(`#${q.id}-fv`); if (range) range.value = v; store.set(q.id + ':fv', v); paintFlow(q);
  }
}

/* ---------- the >>> prompt under each picture ---------- */
async function shellRun(q, code, opts = {}) {
  const st = S[q.id]; code = code.trim(); if (!code) return null;
  if (opts.history !== false) { st.hist.push(code); st.hp = st.hist.length; }
  let r;
  try { r = await Py.call('shell', { qid: q.id, src: code, var: q.var, vars: q.vars, setup: q.setup }); }
  catch (e) { logShell(q, { code, lines: [['err', failText(e)]] }); return null; }
  logShell(q, { code, lines: r.lines });
  st.vals = r.state;
  renderPicture(q, r.hl);
  return r;
}
function logShell(q, entry) {
  const log = $(`[data-log="${q.id}"]`), div = document.createElement('div');
  const tip = l => l[0] === 'err' && /U\+201[89CD]/.test(l[1]) ? `<div class="s-note">Those are curly quotes from a word processor. Retype them as straight quotes ' or ".</div>` : '';
  div.innerHTML = `<div class="s-in">&gt;&gt;&gt; <b>${hl(entry.code)}</b></div>` + entry.lines.map(l => `<div class="s-${l[0]}">${esc(l[1])}</div>${tip(l)}`).join('');
  log.appendChild(div);
  while (log.children.length > 30) log.firstChild.remove();
  log.scrollTop = log.scrollHeight;
}
async function resetPicture(q, silent) {
  const st = S[q.id];
  try {
    const r = await Py.call('shell', { qid: q.id, src: '', var: q.var, vars: q.vars, setup: q.setup, reset: true });
    st.vals = r.state;
  } catch (e) { st.vals = initVals(q); }
  renderPicture(q, null);
  if (q.id === 'q1') updSlice();
  if (!silent) logShell(q, { code: q.setup, lines: [['note', 'picture reset']] });
}

/* ---------- code editors (CodeMirror 6, vendor/codemirror.js) ---------- */
function kindOf(q, name, text) {
  if (q.vars.includes(name)) { const v = valOf(q, name) || initVals(q)[name].value; return v && BRK[v.t] ? v.t : null; }
  const m = new RegExp('^\\s*' + name + '\\s*=\\s*([\\[\\(\\{\'"])', 'm').exec(text || '');
  return m ? ({ '[': 'list', '(': 'tuple', '{': 'dict' }[m[1]] || 'str') : null;
}
const cmTheme = CM.EditorView.theme({
  '&': { color: 'var(--code-ink)', backgroundColor: 'transparent', fontSize: '14px' },
  '.cm-scroller': { fontFamily: 'var(--f-code)', lineHeight: '1.6' },
  '.cm-content': { caretColor: 'var(--code-ok)', padding: '10px 0' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--code-ok)', borderLeftWidth: '2px' },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': { backgroundColor: 'var(--code-bg)', color: 'var(--code-dim)', border: 'none' },  // solid, so code never shows through
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 10px 0 12px' },
  '.cm-activeLine': { backgroundColor: 'var(--code-active)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--code-ink)' },
  '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: 'var(--code-sel)' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': { backgroundColor: 'var(--code-sel)', color: 'inherit', outline: '1px solid var(--code-ok)' },
  '.cm-placeholder': { color: 'var(--code-dim)', fontStyle: 'italic' },
  '.cm-tooltip': { backgroundColor: 'var(--code-pop)', border: '1px solid var(--code-line)', color: 'var(--code-ink)', borderRadius: '8px', overflow: 'hidden' },
  '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--f-code)', maxHeight: '14em' },
  '.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px' },
  '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--code-sel)', color: 'var(--code-ink)' },
  '.cm-completionDetail': { color: 'var(--code-dim)', fontStyle: 'normal', marginLeft: '8px' },
}, { dark: true });
const T_ = CM.tags;
const cmColours = CM.syntaxHighlighting(CM.HighlightStyle.define([
  { tag: [T_.keyword, T_.controlKeyword, T_.definitionKeyword, T_.moduleKeyword, T_.operatorKeyword], color: 'var(--code-kw)', fontWeight: '600' },
  { tag: [T_.string, T_.special(T_.string)], color: 'var(--code-str)' },
  { tag: [T_.number, T_.bool, T_.null, T_.atom], color: 'var(--code-num)' },
  { tag: [T_.comment, T_.lineComment], color: 'var(--code-dim)', fontStyle: 'italic' },
  { tag: [T_.function(T_.variableName), T_.function(T_.propertyName), T_.standard(T_.variableName), T_.propertyName], color: 'var(--code-fn)' },
]));
/* Lesson-aware suggestions on top of CodeMirror's Python ones: the question's
   variables, and the real methods of a list/tuple/dict/str after a dot. */
function labCompletions(q) {
  return ctx => {
    const doc = ctx.state.doc.toString();
    const dot = ctx.matchBefore(/[A-Za-z_]\w*\.\w*$/);
    if (dot) {
      const obj = dot.text.slice(0, dot.text.indexOf('.')), kind = kindOf(q, obj, q.setup + '\n' + doc);
      const names = METHODS[kind] || [...new Set([...METHODS.list, ...METHODS.tuple])];
      return { from: dot.from + obj.length + 1, options: names.map(n => ({ label: n, type: 'method', detail: kind || '', apply: n + '(' })), validFor: /^\w*$/ };
    }
    const w = ctx.matchBefore(/[A-Za-z_]\w*/);
    if (!w && !ctx.explicit) return null;
    return { from: w ? w.from : ctx.pos, options: q.vars.map(v => ({ label: v, type: 'variable', detail: (valOf(q, v) && valOf(q, v).t) || '', boost: 10 })), validFor: /^\w*$/ };
  };
}
/* Tab: take the open suggestion; otherwise ask for suggestions after a word. */
function tabKey(fallback) {
  return view => {
    if (CM.completionStatus(view.state) === 'active') return CM.acceptCompletion(view);
    const pos = view.state.selection.main.head, before = view.state.doc.sliceString(Math.max(0, pos - 1), pos);
    if (/[\w.]/.test(before)) return CM.startCompletion(view);
    return fallback ? fallback(view) : false;
  };
}
function pythonFor(q) {
  const lang = CM.python();
  return [lang, lang.language.data.of({ autocomplete: labCompletions(q) })];
}
/* The homework.py editor. Returns an object with .value like a textarea. */
function codeEditor(q, parent, initial, { onChange, onRun, label, placeholder }) {
  const view = new CM.EditorView({
    parent,
    state: CM.EditorState.create({
      doc: initial,
      extensions: [
        ...(label ? [CM.placeholder(placeholder || '')] : [CM.lineNumbers(), CM.highlightActiveLineGutter(), CM.highlightActiveLine()]), CM.drawSelection(),
        CM.history(), CM.indentOnInput(), CM.bracketMatching(), CM.closeBrackets(),
        CM.indentUnit.of('    '), CM.EditorState.tabSize.of(4), CM.EditorView.lineWrapping,
        CM.autocompletion({ activateOnTyping: true, icons: false }),
        pythonFor(q), cmColours, cmTheme,
        CM.Prec.highest(CM.keymap.of([
          { key: 'Mod-Enter', run: () => { onRun(); return true; } },
          { key: 'Tab', run: tabKey(CM.indentMore) },
        ])),
        CM.keymap.of([...CM.closeBracketsKeymap, ...CM.defaultKeymap, ...CM.historyKeymap, CM.indentWithTab]),
        CM.EditorView.updateListener.of(u => { if (u.docChanged) onChange(); }),
        CM.EditorView.contentAttributes.of({ 'aria-label': label || `Your Python script for ${q.id.toUpperCase()}`, autocapitalize: 'off', spellcheck: 'false' }),
      ],
    }),
  });
  return {
    view,
    get value() { return view.state.doc.toString(); },
    set value(s) { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: s } }); },
    focus() { view.focus(); },
    select() { view.dispatch({ selection: { anchor: 0, head: view.state.doc.length } }); view.focus(); },
    dispatchEvent() { /* changes are picked up by the update listener */ },
  };
}
/* A one-line Python box (the >>> prompt and the assert checks). */
function lineEditor(q, parent, { initial = '', placeholder = '', label = '', onEnter, onChange, history }) {
  const keys = [
    { key: 'Enter', run: v => { if (CM.completionStatus(v.state) === 'active') return CM.acceptCompletion(v); onEnter(v); return true; } },
    { key: 'Tab', run: tabKey(null) },
  ];
  if (history) {
    keys.push(
      { key: 'ArrowUp', run: v => { if (CM.completionStatus(v.state) === 'active') return false; const s = history.up(); if (s == null) return false; setLine(v, s); return true; } },
      { key: 'ArrowDown', run: v => { if (CM.completionStatus(v.state) === 'active') return false; setLine(v, history.down()); return true; } },
    );
  }
  const view = new CM.EditorView({
    parent,
    state: CM.EditorState.create({
      doc: initial,
      extensions: [
        CM.history(), CM.closeBrackets(), CM.bracketMatching(), CM.drawSelection(),
        CM.autocompletion({ activateOnTyping: true, icons: false }),
        CM.placeholder(placeholder), pythonFor(q), cmColours, cmTheme,
        CM.EditorState.transactionFilter.of(tr => tr.newDoc.lines > 1 ? [] : tr),  // one line only
        CM.Prec.highest(CM.keymap.of(keys)),
        CM.keymap.of([...CM.closeBracketsKeymap, ...CM.defaultKeymap, ...CM.historyKeymap]),
        CM.EditorView.updateListener.of(u => { if (u.docChanged && onChange) onChange(u.state.doc.toString()); }),
        CM.EditorView.contentAttributes.of({ 'aria-label': label, autocapitalize: 'off', spellcheck: 'false' }),
      ],
    }),
  });
  return view;
}
function setLine(view, s) { view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: s || '' }, selection: { anchor: (s || '').length } }); }

/* ---------- homework.py editor ---------- */
function buildEditor(q) {
  const host = $(`[data-editor="${q.id}"]`);
  const ask = q.ask ? `<label class="ask" title="What you would type when input() asks. More than one answer? Separate them with commas."><span>input() answer</span><input data-ask value="${esc(store.get(q.id + ':ask') ?? q.ask)}" autocomplete="off" spellcheck="false" aria-label="Answer for input() when ${q.id.toUpperCase()} runs"></label>` : '';
  host.innerHTML = `<div class="editor">
    <div class="ed-bar"><span class="file">homework.py · ${q.id.toUpperCase()}</span>${ask}
      <div class="ed-actions"><button type="button" class="run">Run ▶</button><button type="button" class="step" title="Run one line at a time">Step</button><button type="button" class="copy">Copy</button><button type="button" class="reset">Start over</button></div></div>
    <div class="ed-cm"></div>
    <div class="console"><div class="con-head"><span>Output</span><label><input type="checkbox" id="${q.id}-trace" checked> show each line</label></div><div class="con-body" aria-live="polite"></div></div>
  </div>`;
  const con = $('.console', host), body = $('.con-body', host), st = S[q.id];
  st.body = body;
  st.ta = codeEditor(q, $('.ed-cm', host), store.get(q.id + ':code') ?? q.starter, {
    onChange: () => { store.set(q.id + ':code', st.ta.value); st.stepping = false; },
    onRun: () => runAll(q),
  });
  const askEl = $('[data-ask]', host);
  if (askEl) {
    askEl.addEventListener('input', () => { store.set(q.id + ':ask', askEl.value); st.stepping = false; });
    askEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runAll(q); } });
  }
  const tr = $(`#${q.id}-trace`, host);
  tr.addEventListener('change', () => con.classList.toggle('hide-trace', !tr.checked));
  $('.run', host).onclick = () => runAll(q);
  $('.step', host).onclick = () => stepOne(q);
  $('.copy', host).onclick = e => copyText(st.ta.value, e.currentTarget, st.ta);
  const rs = $('.reset', host);
  rs.onclick = () => {
    if (rs.dataset.armed) { st.ta.value = q.starter; body.innerHTML = ''; rs.textContent = 'Start over'; delete rs.dataset.armed; return; }
    rs.dataset.armed = '1'; rs.textContent = 'Sure? Click again';
    setTimeout(() => { if (rs.dataset.armed) { delete rs.dataset.armed; rs.textContent = 'Start over'; } }, 3000);
  };
}
/* What a homework.py run sends to Python: the answers for input(), and for questions about
   if statements, the test values every if is tried with (q.probe). */
const askValues = q => { const el = $(`[data-editor="${q.id}"] [data-ask]`); return (el ? el.value : '').split(',').map(x => x.trim()).filter(Boolean); };
function runArgs(q, src) {
  const a = { src, var: q.var, vars: q.vars };
  if (q.ask) a.inputs = askValues(q);
  if (q.probe) a.probe = { var: q.probe.var, values: q.probe.values.map(pyLit) };
  return a;
}
function srcLines(q, e) { return S[q.id].ta.value.replace(/\r\n?/g, '\n').split('\n').slice(e.line - 1, e.end).join('\n'); }
function entryHTML(q, e) {
  let h = `<div class="c-line"><i>${e.line}</i> ${hl(srcLines(q, e))}</div>`;
  h += e.out.map(o => `<div class="c-out">${esc(o)}</div>`).join('');
  if (e.silent && !e.error) h += '<div class="c-note">   ↳ nothing printed: in a script, wrap it in print( ) to see it</div>';
  if (e.error) h += errHTML(e.error);
  if (e.error && /EOFError/.test(e.error)) h += '<div class="c-note">input() asked for an answer but there wasn\'t one. Type it in the input() answer box next to Run.</div>';
  return h;
}
function errHTML(text) {
  let h = `<div class="c-err">${esc(text)}</div>`;
  if (/U\+201[89CD]/.test(text)) h += `<div class="c-note">Those are curly quotes from a word processor. Retype them as straight quotes ' or ".</div>`;
  return h;
}
async function runAll(q) {
  const st = S[q.id]; st.stepping = false;
  st.body.innerHTML = `<div class="c-note">${Py.ready ? 'running…' : 'waiting for Python to start…'}</div>`;
  let r;
  try { r = await Py.call('run', runArgs(q, st.ta.value)); }
  catch (e) { st.body.innerHTML = `<div class="c-err">${esc(failText(e))}</div>`; return; }
  let h;
  if (r.syntax) h = errHTML(r.syntax) + '<div class="c-note">Python checks the whole file before running it, so nothing ran.</div>';
  else {
    h = r.entries.map(e => entryHTML(q, e)).join('');
    if (!r.entries.some(e => e.error)) h += `<div class="c-done">✓ finished · ${r.outputs.length} line${r.outputs.length === 1 ? '' : 's'} printed</div>`;
  }
  st.body.innerHTML = h; st.body.scrollTop = 0;
  grade(q, r);
  // syncPicture: after a run, the picture shows the variables as the script left them.
  const names = q.syncPicture && r.finals ? q.vars.filter(v => r.finals[v] && BRK[r.finals[v].t]) : [];
  if (names.length) {
    const s = await Py.call('shell', { qid: q.id, src: names.map(v => `${v} = ${r.final_reprs[v]}`).join('\n'), var: q.var, vars: q.vars, setup: q.setup });
    st.vals = s.state; renderPicture(q, null);
    logShell(q, { code: `# picture now shows ${names.join(' and ')} at the end of homework.py`, lines: names.map(v => ['out', r.final_reprs[v]]) });
  }
}
async function stepOne(q) {
  const st = S[q.id], restart = !st.stepping;
  if (restart) st.stepHTML = '';
  let r;
  try { r = await Py.call('step', { qid: q.id, src: st.ta.value, var: q.var, vars: q.vars, restart, inputs: q.ask ? askValues(q) : null }); }
  catch (e) { st.body.innerHTML = `<div class="c-err">${esc(failText(e))}</div>`; st.stepping = false; return; }
  if (r.syntax) { st.body.innerHTML = errHTML(r.syntax); st.stepping = false; return; }
  if (r.entry) st.stepHTML += entryHTML(q, r.entry);
  let tail;
  if (r.errored) tail = '<div class="c-note">stopped at the error. Press Step to start again.</div>';
  else if (r.done) {
    tail = '<div class="c-done">✓ end of file</div>';
    // grading if statements needs the full probe, so do one quiet run for it
    if (q.probe) Py.call('run', runArgs(q, st.ta.value)).then(x => grade(q, x), () => {}); else grade(q, r);
  }
  else tail = `<div class="c-next">▶ next: line ${r.next} (press Step)</div>`;
  st.stepping = !r.done;
  st.body.innerHTML = st.stepHTML + tail; st.body.scrollTop = st.body.scrollHeight;
}

/* ---------- grading homework.py ---------- */
function gradeCore(q, res, raw) {
  raw = raw.replace(/\r\n?/g, '\n');
  const code = raw.split('\n').map(stripComment).join('\n');
  const starterComments = new Set(q.starter.split('\n').map(commentText).filter(Boolean));
  const outputs = res.outputs || [];
  const fin = name => (res.finals || {})[name];
  const ctx = {
    code,
    printed: s => outputs.includes(s),
    printedAny: a => a.some(s => outputs.includes(s)),
    final: f => { const o = res.final; return !!(o && o.items && f(o.items)); },
    // a variable as the script left it: dict(name) -> {key: value}, list(name) -> [items]; null if it isn't one
    dict: name => { const o = fin(name); return o && o.t === 'dict' ? Object.fromEntries(o.items.map(([k, x]) => [display(k), x])) : null; },
    list: name => { const o = fin(name); return o && o.t === 'list' ? o.items : null; },
    explained: () => WHY_RE.test(raw.split('\n').map(commentText).filter(t => t && !starterComments.has(t)).join(' ').toLowerCase()),
    ran: !res.syntax,
    // each top-level if statement, tried with every q.probe value: {line, outs: [printed lines | null], ops, elifs, else}
    ifs: res.probe || [],
    // the student's own comments under starter heading "# n." (all their comments if that heading is gone)
    notes: n => {
      const lines = raw.split('\n'), head = new RegExp('^\\s*#\\s*' + n + '\\.'), anyHead = /^\s*#\s*\d+\./;
      const own = l => { const t = commentText(l); return t && !starterComments.has(t) ? t : ''; };
      const at = lines.findIndex(l => head.test(l) && starterComments.has(commentText(l)));
      if (at < 0) return lines.map(own).filter(Boolean).join(' ');
      const out = [];
      for (const l of lines.slice(at + 1)) { if (anyHead.test(l) && starterComments.has(commentText(l))) break; const t = own(l); if (t) out.push(t); }
      return out.join(' ');
    },
  };
  // each task sees only the if statements under its own heading(s), so task 4's if can't pass task 1
  const lines = raw.split('\n'), heads = {};
  lines.forEach((l, i) => { const m = /^\s*#\s*(\d+)\./.exec(l); if (m && starterComments.has(commentText(l)) && !(m[1] in heads)) heads[m[1]] = i + 1; });
  const order = Object.values(heads).sort((a, b) => a - b);
  const ifsUnder = ns => {
    const spans = ns.filter(n => n in heads).map(n => [heads[n], order.find(h => h > heads[n]) || Infinity]);
    return spans.length ? ctx.ifs.filter(b => spans.some(([a, z]) => b.line > a && b.line < z)) : ctx.ifs;
  };
  return q.tasks.map((t, k) => { try { return !!t.check({ ...ctx, ifs: ifsUnder(t.under || [k + 1]) }); } catch (e) { return false; } });
}
function grade(q, res) {
  const d = gradeCore(q, res, S[q.id].ta.value);
  S[q.id].done = d; store.set(q.id + ':done', JSON.stringify(d));
  paintTasks(q); paintScores();
}

/* ---------- assert practice cells ---------- */
function cellHTML(q, t, k) {
  const c = t.cell, id = `${q.id}-c${k}`;
  if (c.prog) return `<div class="pc" data-pc="${k}">
    <span class="pc-label h-c">${esc(c.label)}</span>
    <div class="pc-prog" data-prog></div>
    <div class="pc-line"><button type="button" class="pc-btn" data-check>Check</button><button type="button" class="pc-btn" data-addscript>Add to homework.py</button></div>
    <div class="pc-res" data-res></div></div>`;
  if (c.why) {
    // several lines show like the >>> prompt does: >>> first, then ...
    const tc = !c.tryCode ? '' : c.tryCode.split('\n').map((l, i) => `<span class="pr">${i ? '...' : '&gt;&gt;&gt;'}</span> ${hl(l)}`).join('\n');
    const tryIt = !c.tryCode ? '' : `<div class="pc-line pc-try"><span class="code">${tc}</span><button type="button" class="pc-btn" data-try>Run it</button></div>
    <div class="pc-res" data-try-res></div>`;
    const write = `<label class="pc-label" for="${id}"><span class="h-c">${esc(c.label || '# Why? Explain in your own words:')}</span></label>
    <textarea class="pc-why" id="${id}" rows="${c.rows || 3}" spellcheck="true" placeholder="${esc(c.ph || 'Python stops because…')}"></textarea>
    <div class="pc-line"><button type="button" class="pc-btn" data-check>Check</button><button type="button" class="pc-btn" data-addscript>Add to homework.py</button></div>
    <div class="pc-res" data-res></div>`;
    // A guess (c.ok) is written before running the line; an explanation comes after.
    return `<div class="pc" data-pc="${k}">${c.ok ? write + tryIt : tryIt + write}</div>`;
  }
  if (c.stmt) return `<div class="pc" data-pc="${k}">
    <div class="pc-line"><span class="pr">&gt;&gt;&gt;</span><div class="pc-in" data-cm data-ph="type a line of Python" data-label="Your line of Python for task ${k + 1}"></div><button type="button" class="pc-btn" data-check>Check</button></div>
    <div class="pc-res" data-res></div></div>`;
  return `<div class="pc" data-pc="${k}">
    <div class="pc-line"><span class="pr">&gt;&gt;&gt;</span><div class="pc-in" data-cm data-ph="type a line of Python" data-label="Your line of Python for task ${k + 1}"></div><button type="button" class="pc-btn" data-check>Check</button></div>
    <div class="pc-res" data-res></div></div>`;
}
const cellText = (q, k) => S[q.id].inputs[k] ?? (q.tasks[k].cell && q.tasks[k].cell.start) ?? '';
function cellSpecs(q) {
  const st = S[q.id], varRe = new RegExp('\\b(' + q.vars.join('|') + ')\\b');
  return q.tasks.map((t, k) => {
    const c = t.cell; if (!c || c.why) return { kind: null };
    const input = (st.inputs[k] || '').trim();
    if (c.prog) {
      const vals = c.values || q.probe.values;
      return { kind: 'prog', input: cellText(q, k), want: vals.map(c.prog), var: q.probe.var, values: vals.map(pyLit) };
    }
    return { kind: c.stmt ? 'stmt' : 'expr', input, expect: c.expect || null, asserts: c.asserts || [], skip: !!input && !varRe.test(input) };
  });
}
function composeCell(q, t, k, r) {
  const c = t.cell; if (!c) return null;
  const input = cellText(q, k).trim();
  if (c.why) {
    if (!input) return { state: 'empty', lines: [] };
    const ok = c.ok ? c.ok.test(input) : input.length >= 15 && (c.re || WHY_RE).test(input.toLowerCase());
    return ok
      ? { state: 'pass', lines: [['ok', c.okMsg || '✓ answered. Your teacher grades the explanation.']] }
      : { state: 'fail', lines: [['note', c.whyHint || 'Say what Python does (the error) and why tuples behave that way.']] };
  }
  if (!r) return null;
  const P = (r.printed || []).map(p => ['out', p]);
  if (r.state === 'empty') return { state: 'empty', lines: [] };
  if (r.state === 'blocked') return { state: 'blocked', lines: r.has_input ? [['note', `Finish task ${r.blocked_by + 1} first. This list depends on it.`]] : [] };
  if (r.state === 'skip') return { state: 'fail', lines: [['note', `Use ${q.var} to get there. Typing the answer in directly doesn't count.`]] };
  if (c.prog) {
    const v = q.probe.var, vals = c.values || q.probe.values;
    const trap = (c.traps || []).find(([re]) => re.test(input));
    // setting the variable yourself means every test value prints the same thing
    const sets = !c.values && new RegExp(`^\\s*${v}\\s*=(?!=)`, 'm').test(input);
    const notes = [...(trap ? [['note', trap[1]]] : []), ...(sets ? [['note', `${v} is already set, and Check changes it each time. Leave out your own ${v} = line.`]] : [])];
    const said = p => p.length ? p.map(s => `"${s}"`).join(' then ') : 'nothing';
    if (r.error && !r.v) return { state: 'fail', lines: [['err', r.error], ...notes] };
    if (r.error) return { state: 'fail', lines: [['err', `✗ When ${v} is ${r.v}, your code stops with an error:`], ['err', r.error], ...notes] };
    if (r.assert_failed) return { state: 'fail', lines: [['err', `✗ When ${v} is ${r.v}, your code prints ${said(r.printed)}. It should print ${said(r.want ? [r.want] : [])}.`], ...notes] };
    if (c.must && !c.must[0].test(input)) return { state: 'fail', lines: [...(vals.length > 1 ? [['ok', 'Right every time…']] : []), ['note', c.must[1]]] };
    return { state: 'pass', lines: [['ok', vals.length > 1 ? `✓ right for every ${v} we tried: ${vals.map(pyLit).join(', ')}` : `✓ it runs and prints "${c.prog(vals[0])}"`]] };
  }
  if (r.not_expr) return { state: 'fail', lines: [['note', `For this task, show a value: for example print(${q.var}[0]) or just ${q.var}[0]. No = or del here.`]] };
  if (r.error) return { state: 'fail', lines: [...P, ['err', r.error]] };
  const nowVar = q.vars.find(v => new RegExp('\\b' + v + '\\b').test(input)) || q.var;
  const shown = c.stmt ? [...P, ['note', `${nowVar} is now ${r.now[nowVar]}`]] : (r.shown || []).map(s => ['out', s]);
  if (r.assert_failed) return { state: 'fail', lines: [...shown, ['err', '✗ Not yet. Read the task again and compare.']] };
  if (c.must && !c.must[0].test(input)) return { state: 'fail', lines: [...shown, ['note', c.must[1]]] };
  return { state: 'pass', lines: [...shown, ['ok', '✓ passed']] };
}
async function checkCells(q) {
  const st = S[q.id];
  store.set(q.id + ':cells', JSON.stringify(st.inputs));
  let res;
  try { res = await Py.call('cells', { setup: q.setup, var: q.var, vars: q.vars, specs: cellSpecs(q) }); }
  catch (e) { res = q.tasks.map(() => ({ state: 'fail', error: failText(e) })); }
  st.cells = q.tasks.map((t, k) => composeCell(q, t, k, res[k]));
  q.tasks.forEach((t, k) => {
    const r = st.cells[k], el = $(`#${q.id} [data-pc="${k}"] [data-res]`); if (!el) return;
    el.innerHTML = r ? r.lines.map(([cls, txt]) => `<div class="s-${cls}">${esc(txt)}</div>`).join('') : '';
  });
  paintTasks(q); paintScores();
}
function addToScript(q, k) {
  const st = S[q.id], c = q.tasks[k].cell, raw = cellText(q, k), text = c.prog ? raw.replace(/\s+$/, '') : raw.trim(); if (!text.trim()) return;
  const lines = c.prog ? text : text.split(/\n/).map(l => '# ' + l.trim()).join('\n');
  const ta = st.ta, src = ta.value, anchor = c.anchor || '#    What happens? Why? Write your answer as comments below.';
  const at = src.indexOf(anchor);
  if (at < 0) { ta.value = src.replace(/\s*$/, '') + '\n' + lines + '\n'; ta.dispatchEvent(new Event('input')); return; }
  const from = at + anchor.length, next = src.slice(from).search(/\n# \d+\./), to = next < 0 ? src.length : from + next;
  const section = src.slice(from, to).trim(), end = from + src.slice(from, to).replace(/\s+$/, '').length;
  // the box grew from code already added here (task 1's if, now with an else): replace it, don't add a copy
  const grew = c.prog && section && !/^#/m.test(section) && text.startsWith(section);
  if (section.includes(lines)) return;
  ta.value = grew ? src.slice(0, from) + '\n' + lines + (next < 0 ? '\n' : '\n\n\n') + src.slice(to).replace(/^\n+/, '')
                  : src.slice(0, end) + '\n' + lines + src.slice(end);
  ta.dispatchEvent(new Event('input'));
}
function buildTasks(q) {
  const st = S[q.id], ol = $(`[data-tasks="${q.id}"]`);
  try { st.inputs = JSON.parse(store.get(q.id + ':cells') || '{}') || {}; } catch (e) { st.inputs = {}; }
  ol.innerHTML = q.tasks.map((t, k) => `<li class="task" data-t="${k}"><span class="tick" aria-hidden="true"></span><div class="task-main">
    <div class="t-text">${t.text} <span class="pts">${t.pts} pts</span></div>
    ${t.cell ? cellHTML(q, t, k) : ''}
    <div class="task-foot"><span class="st st-a">practice check</span><span class="st st-s">homework.py</span>
    <div class="peek">${t.hint ? `<details><summary>Hint</summary><div>${t.hint}</div></details>` : ''}</div></div>
  </div></li>`).join('');
  q.tasks.forEach((t, k) => {
    const pc = $(`[data-pc="${k}"]`, ol); if (!pc) return;
    const save = v => { st.inputs[k] = v; store.set(q.id + ':cells', JSON.stringify(st.inputs)); };
    const host = $('[data-cm]', pc), why = $('.pc-why', pc), prog = $('[data-prog]', pc);
    if (host) lineEditor(q, host, { initial: st.inputs[k] || '', placeholder: host.dataset.ph, label: host.dataset.label, onChange: save, onEnter: () => checkCells(q) });
    if (prog) {
      const c = t.cell, ed = codeEditor(q, prog, cellText(q, k), { label: `Your code for task ${k + 1}`, placeholder: c.ph, onRun: () => checkCells(q), onChange: () => save(ed.value) });
      // a task that builds on an earlier one starts from that box's code
      if (c.from != null) prog.addEventListener('focusin', () => { if (!ed.value.trim() && (st.inputs[c.from] || '').trim()) ed.value = st.inputs[c.from]; });
    }
    if (why) { why.value = st.inputs[k] || ''; why.addEventListener('input', () => save(why.value)); }
    $('[data-check]', pc).addEventListener('click', () => checkCells(q));
    const tryBtn = $('[data-try]', pc);
    if (tryBtn) tryBtn.addEventListener('click', async () => {
      const r = await shellRun(q, t.cell.tryCode, { history: false });
      const err = r && r.lines.find(l => l[0] === 'err'), out = r ? r.lines.filter(l => l[0] === 'out') : [];
      // a SyntaxError (like a missing indent) stops Python before anything runs: no traceback
      $('[data-try-res]', pc).innerHTML = err
        ? `<div class="s-err">${esc((/^(Syntax|Indentation|Tab)Error/.test(err[1]) ? '' : 'Traceback (most recent call last):\n  File "<stdin>", line 1, in <module>\n') + err[1])}</div>`
        : out.length ? out.map(l => `<div class="s-out">${esc(l[1])}</div>`).join('') : '<div class="s-ok">(no error)</div>';
    });
    const addBtn = $('[data-addscript]', pc);
    if (addBtn) addBtn.addEventListener('click', () => { addToScript(q, k); addBtn.textContent = 'Added ✓'; setTimeout(() => addBtn.textContent = 'Add to homework.py', 1500); });
  });
  try { const d = JSON.parse(store.get(q.id + ':done') || 'null'); if (Array.isArray(d)) st.done = d; } catch (e) { /* ignore */ }
}
function paintTasks(q) {
  const d = S[q.id].done || [], c = S[q.id].cells || [];
  $$(`[data-tasks="${q.id}"] .task`).forEach((li, i) => {
    const pass = !!(c[i] && c[i].state === 'pass');
    li.classList.toggle('done', !!d[i]); li.classList.toggle('practiced', pass);
    const a = $('.st-a', li), s = $('.st-s', li);
    a.classList.toggle('on', pass); a.textContent = pass ? (q.tasks[i].cell && q.tasks[i].cell.why ? 'answered ✓' : 'check ✓') : 'practice check';
    s.classList.toggle('on', !!d[i]); s.textContent = d[i] ? (q.tasks[i].doneLabel ? 'homework.py ✓ (teacher grades)' : 'homework.py ✓') : 'homework.py';
  });
}
function tally(q) {
  const d = S[q.id].done || [], c = S[q.id].cells || [];
  return {
    got: q.tasks.reduce((a, t, i) => a + (d[i] ? t.pts : 0), 0),
    max: q.tasks.reduce((a, t) => a + t.pts, 0),
    checks: c.filter(x => x && x.state === 'pass').length,
    cells: q.tasks.filter(t => t.cell).length,
  };
}
function paintScores() {
  let got = 0, max = 0, bonus = 0;
  const chips = QS.map(q => {
    const t = tally(q);
    if (q.bonus) bonus = t.got; else { got += t.got; max += t.max; }
    const el = $(`[data-pts="${q.id}"]`);
    el.textContent = `${t.got} / ${t.max} pts · ${t.checks}/${t.cells} checks`; el.classList.toggle('full', t.got === t.max);
    return `<a class="chip" href="#${q.id}">${q.id.toUpperCase()} ${q.title}${q.bonus ? ' (bonus)' : ''} · ${t.got}/${t.max}</a>`;
  });
  $('#scoreboard').innerHTML = `<span class="chip total">Score ${got} / ${max}${bonus ? ` + ${bonus} bonus` : ''}</span>` + chips.join('') + '<a class="chip" href="#handin">Hand in →</a>';
}

/* ---------- copy ---------- */
function copyText(text, btn, fallbackEl) {
  const label = btn.textContent;
  const done = () => { btn.textContent = 'Copied'; setTimeout(() => btn.textContent = label, 1400); };
  const fb = () => {
    if (fallbackEl) {
      fallbackEl.focus();
      if (fallbackEl.select) fallbackEl.select();
      else { const r = document.createRange(); r.selectNodeContents(fallbackEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
    btn.textContent = 'Press Ctrl/⌘+C'; setTimeout(() => btn.textContent = label, 2200);
  };
  try { navigator.clipboard.writeText(text).then(done, fb); } catch (e) { fb(); }
}

/* ---------- hand-in report ---------- */
async function buildReport() {
  const name = $('#student-name').value.trim() || '(name not given)';
  const now = new Date(), pad = n => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  let got = 0, max = 0, bonus = 0, bonusMax = 0; const sum = [], blocks = [];
  for (const q of QS) {
    const src = S[q.id].ta.value.replace(/\r\n?/g, '\n');
    let res;
    try { res = await Py.call('run', runArgs(q, src)); }
    catch (e) { res = { entries: [{ error: failText(e) }], outputs: [], final: null }; }
    S[q.id].done = gradeCore(q, res, src); store.set(q.id + ':done', JSON.stringify(S[q.id].done)); paintTasks(q);
    const t = tally(q);
    if (q.bonus) { bonus = t.got; bonusMax = t.max; } else { got += t.got; max += t.max; }
    const head = `# ${q.id.toUpperCase()}  ${q.title}${q.bonus ? ' (bonus)' : ''}`;
    sum.push('#', head + ' '.repeat(Math.max(2, 46 - head.length)) + `${t.got} / ${t.max} pts   (practice checks ${t.checks}/${t.cells})`);
    q.tasks.forEach((task, i) => {
      const c = S[q.id].cells[i], typed = (S[q.id].inputs[i] || '').trim();
      sum.push(`#   [${S[q.id].done[i] ? 'x' : ' '}] ${i + 1}. ${plain(task.text.replace(/<\/?pre>/g, '\n')).trim().replace(/\s*\n\s*/g, ' / ')}  (${task.pts} pts)`);
      if (task.cell && task.cell.why) sum.push(`#          explanation box: ${typed ? typed.replace(/\s*\n\s*/g, ' / ') : '(empty)'}`);
      else if (task.cell) sum.push(`#          practice check: ${c && c.state === 'pass' ? 'passed' : 'not passed'}${typed ? '   typed: ' + typed : ''}`);
    });
    const comment = s => s.split('\n').map(l => '# ' + l).join('\n');
    let outTxt = res.syntax ? comment(res.syntax) : (res.outputs.map(comment).join('\n') || '# (nothing printed)');
    const err = res.entries && res.entries.find(e => e.error);
    if (err) outTxt += '\n' + comment(err.error);
    const asked = q.ask ? `, input() answer: ${askValues(q).join(', ') || '(none)'}` : '';
    blocks.push(`# ===== ${q.id.toUpperCase()}: ${q.title} =====\n\n${src.trim()}\n\n# --- what this printed (Python ${S.version || '3'}${asked}) ---\n${outTxt}`);
  }
  paintScores();
  const top = [
    '# ================================================================',
    `# ${window.LESSON.title} · hand-in report`,
    `# Student: ${name}`,
    `# Made:    ${stamp}`,
    `# Score:   ${got} / ${max}${bonusMax ? `   bonus ${bonus} / ${bonusMax}` : ''}`,
    '#',
    '# [x] = homework.py prints the right thing for that task.',
    '# "practice check" = the quick check box under each task on the lab page.',
    '# To re-run a script, paste it into the lab page (it runs sandboxed there).',
    ...sum,
    '# ================================================================',
  ];
  return top.join('\n') + '\n\n\n' + blocks.join('\n\n\n') + '\n';
}
function reportMsg(t, bad) { const m = $('#report-msg'); m.textContent = t; m.className = 'msg' + (bad ? ' bad' : ' good'); m.hidden = !t; }
async function refreshPreview() {
  try { const r = await buildReport(); $('#report-pre').innerHTML = hl(r); return r; }
  catch (e) { reportMsg(failText(e), true); return null; }
}

/* ---------- Q1 slice explorer (pages that have one) ---------- */
let sliceTimer = null;
function updSlice() {
  if (!$('#q1-start')) return;
  const v = S.q1 && valOf(QS[0]); if (!v || !v.items) return;
  const n = v.items.length, a = +$('#q1-start').value, b = +$('#q1-stop').value;
  $('#q1-start').max = n; $('#q1-stop').max = n;
  $('#q1-start-o').textContent = a; $('#q1-stop-o').textContent = b;
  const idxs = []; for (let k = a; k < Math.min(b, n); k++) idxs.push(k);
  applyHL(QS[0], { idxs, slice: true, fence: Math.max(Math.min(b, n), a) });
  const code = `spells[${a}:${b}]`, out = $('#q1-slice-read');
  out.innerHTML = `<span>${hl(code)}</span><span class="arrow">→</span><span class="slice-val">…</span>`;
  clearTimeout(sliceTimer);
  sliceTimer = setTimeout(async () => {
    try {
      const r = await Py.call('peek', { qid: 'q1', expr: code, var: 'spells', setup: QS[0].setup });
      const el = $('.slice-val', out); if (el) el.textContent = r.error || r.repr;
    } catch (e) { /* worker restarting */ }
  }, 120);
}

/* ---------- boot ---------- */
function setStatus(state, detail) {
  $$('[data-py-status]').forEach(el => {
    el.dataset.state = state;
    el.textContent = state === 'ready' ? `Python ${detail} ready` : state === 'error' ? `Python could not start: ${detail}` : 'Starting Python…';
  });
}
Py.on((state, d) => {
  if (state === 'ready') {
    S.version = d.version; setStatus('ready', d.version);
    QS.forEach(q => { resetPicture(q, !d.restarted); checkCells(q); if (q.flow) { loadFlow(q); loadTester(q); } });
  } else setStatus(state, d);
});

QS.forEach(q => {
  S[q.id] = { vals: initVals(q), hist: [], hp: 0, done: [], cells: [], inputs: {}, stepping: false, stepHTML: '' };
  renderPicture(q, null); buildEditor(q); buildTasks(q); paintTasks(q); buildFlow(q);
  q.vars.forEach(name => {
    const row = $(`[data-row="${rowKey(q, name)}"]`); if (!row) return;
    row.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      const v = valOf(q, name); if (!v || !v.items) return;
      const i = +b.dataset.i, mini = b.classList.contains('mini');
      if (v.t === 'dict') { const k = repr(v.items[i][0]); shellRun(q, mini ? `${name}[${k}][${b.dataset.j}]` : `${name}[${k}]`); return; }
      const ii = S[q.id].neg ? i - v.items.length : i;
      shellRun(q, mini ? `${name}[${i}][${b.dataset.j}]` : `${name}[${ii}]`);
    });
  });
  const sh = $(`[data-shell="${q.id}"]`), st = S[q.id];
  lineEditor(q, sh, {
    placeholder: sh.dataset.ph, label: sh.dataset.label,
    onEnter: v => { const code = v.state.doc.toString(); setLine(v, ''); shellRun(q, code); },
    history: {
      up: () => st.hp > 0 ? st.hist[--st.hp] : null,
      down: () => { st.hp = Math.min(st.hist.length, st.hp + 1); return st.hist[st.hp] || ''; },
    },
  });
});
$$('[data-run]').forEach(b => b.addEventListener('click', () => shellRun(QS.find(q => q.id === b.dataset.run), b.dataset.code)));
$$('[data-reset]').forEach(b => b.addEventListener('click', () => resetPicture(QS.find(q => q.id === b.dataset.reset))));
if ($('#q1-front')) [['#q1-front', false], ['#q1-back', true]].forEach(([sel, neg]) => $(sel).addEventListener('click', () => {
  S.q1.neg = neg; $('#q1-front').setAttribute('aria-pressed', String(!neg)); $('#q1-back').setAttribute('aria-pressed', String(neg));
}));
if ($('#q1-start')) { $('#q1-start').addEventListener('input', updSlice); $('#q1-stop').addEventListener('input', updSlice); }
updSlice();
paintScores();

const nameEl = $('#student-name');
nameEl.value = store.get('name') || '';
nameEl.addEventListener('input', () => store.set('name', nameEl.value));
$('#preview-report').addEventListener('toggle', e => { if (e.target.open) refreshPreview(); });
$('#copy-report').addEventListener('click', async e => {
  const btn = e.currentTarget; reportMsg('');
  const r = await refreshPreview(); if (!r) return;
  try {
    await navigator.clipboard.writeText(r);
    reportMsg('Copied. Paste it into your assignment in Google Classroom.');
  } catch (err) {
    $('#preview-report').open = true; copyText(r, btn, $('#report-pre'));
    reportMsg('Copy was blocked. The report is selected below: press Ctrl/⌘+C.', true);
  }
});
$('#dl-report').addEventListener('click', async () => {
  reportMsg('');
  const r = await refreshPreview(); if (!r) return;
  const slug = nameEl.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'homework';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([r], { type: 'text/plain;charset=utf-8' }));
  a.download = `${LESSON_ID}-${slug}.txt`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  reportMsg('Downloaded. Attach the file to your assignment in Google Classroom.');
});

Py.start();
