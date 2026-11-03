/* TurtleView: draws the command stream the Python turtle (vendor/basthon-turtle) emits
   into an inline <svg>. Commands come back from the worker already in SVG space
   (640x480, y down, origin at the middle), one JSON record per turtle action:
   init, turtle_shape, move, rotate, pen, visibility, shape, polygon, write, clear, background.
   The drawing logic follows basthon-turtle's standalone.html renderer (GPL-3.0-or-later,
   Romain Casati / Maciej Olko); the pacing and the step-through are this page's own. */
'use strict';
window.TurtleView = class TurtleView {
  constructor(svg) {
    this.svg = svg;
    this.ns = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', '0 0 640 480');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = '';
    this.bg = this.el('rect', { x: 0, y: 0, width: 640, height: 480, fill: '#ffffff', 'data-bg': '' });
    this.drawing = this.el('g'); this.writing = this.el('g'); this.turtleLayer = this.el('g');
    for (const n of [this.bg, this.drawing, this.writing, this.turtleLayer]) svg.appendChild(n);
    this.turtles = new Map();
    this.queue = []; this.playing = false;
    this.gen = 0;          // bumps on clear()/render()/stop(): a running animation stops
    this.translate = [320, 240];
    this.setTranslate();
    this.speed = 1;        // 1 = watchable, 3 = quick, 0 = instant
  }
  el(tag, attrs = {}) { const n = document.createElementNS(this.ns, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; }
  setTranslate() { for (const g of [this.drawing, this.writing, this.turtleLayer]) g.setAttribute('transform', `translate(${this.translate[0]} ${this.translate[1]})`); }
  clear() {
    this.gen++; this.queue.length = 0;
    for (const g of [this.drawing, this.writing, this.turtleLayer]) g.replaceChildren();
    this.turtles.clear();
    this.bg.setAttribute('fill', '#ffffff');
  }
  shapeEl(g) {
    let n;
    if (g.kind === 'polygon') n = this.el('polygon', { points: g.points.map(p => p.join(',')).join(' ') });
    else if (g.kind === 'rectangle') n = this.el('rect', { x: -g.width / 2, y: -g.height / 2, width: g.width, height: g.height });
    else n = this.el('circle', { cx: 0, cy: 0, r: g.radius || 10 });
    n.setAttribute('vector-effect', 'non-scaling-stroke');
    return n;
  }
  turtle(id) {
    if (!this.turtles.has(id)) {
      const node = this.el('g', { stroke: 'black', fill: 'black', 'stroke-width': 1, opacity: 0 });
      const st = { node, x: 0, y: 0, angle: -90, sw: 1, sl: 1 };
      node.appendChild(this.shapeEl({ kind: 'polygon', points: [[0, 16], [-2, 14], [-1, 10], [-4, 7], [-7, 9], [-9, 8], [-6, 5], [-7, 1], [-5, -3], [-8, -6], [-6, -8], [-4, -5], [0, -7], [4, -5], [6, -8], [8, -6], [5, -3], [7, 1], [6, 5], [9, 8], [7, 9], [4, 7], [1, 10], [2, 14]] }));
      this.turtles.set(id, st); this.turtleLayer.appendChild(node); this.place(st);
    }
    return this.turtles.get(id);
  }
  place(st) { st.node.setAttribute('transform', `translate(${st.x} ${st.y}) rotate(${st.angle}) scale(${st.sw} ${st.sl})`); }
  /* Apply one command. With `ms` > 0 the move/rotate is animated over that many milliseconds. */
  apply(c, ms = 0) {
    const gen = this.gen;
    if (c.type === 'init') {
      this.translate = c.translate || [320, 240]; this.setTranslate();
      this.bg.setAttribute('fill', c.background || '#ffffff');
      for (const g of [this.drawing, this.writing, this.turtleLayer]) g.replaceChildren();
      this.turtles.clear();
      return Promise.resolve();
    }
    if (c.type === 'move') {
      const st = this.turtle(c.turtle);
      let line = null;
      if (c.drawing) {
        line = this.el('line', { x1: c.from[0], y1: c.from[1], x2: c.from[0], y2: c.from[1], stroke: c.color, 'stroke-width': c.width, 'stroke-linecap': c.width > 2 ? 'round' : 'butt', 'data-turtle': c.turtle });
        this.drawing.appendChild(line);
      }
      return this.tween(ms, gen, p => {
        const x = c.from[0] + (c.to[0] - c.from[0]) * p, y = c.from[1] + (c.to[1] - c.from[1]) * p;
        if (line) { line.setAttribute('x2', x); line.setAttribute('y2', y); }
        st.x = x; st.y = y; this.place(st);
      });
    }
    if (c.type === 'rotate') {
      const st = this.turtle(c.turtle);
      return this.tween(ms, gen, p => { st.angle = c.from + (c.to - c.from) * p; this.place(st); });
    }
    if (c.type === 'polygon') {
      this.drawing.appendChild(this.el('polygon', { points: c.points.map(p => p.join(',')).join(' '), fill: c.fill === null ? 'none' : c.fill, stroke: c.outline === null ? 'none' : c.outline, 'stroke-width': c.width, 'data-turtle': c.turtle }));
    } else if (c.type === 'visibility') {
      const st = this.turtle(c.turtle); st.x = c.x; st.y = c.y; st.angle = c.angle; st.node.setAttribute('opacity', c.visible ? 1 : 0); this.place(st);
    } else if (c.type === 'pen') {
      const st = this.turtle(c.turtle); st.node.setAttribute('stroke', c.pencolor); st.node.setAttribute('fill', c.fillcolor);
    } else if (c.type === 'turtle_shape') {
      const st = this.turtle(c.turtle); st.node.replaceChildren(this.shapeEl(c.geometry));
    } else if (c.type === 'shape') {
      const st = this.turtle(c.turtle); st.sw = c.stretch_width; st.sl = c.stretch_length; st.node.setAttribute('stroke-width', c.outline); this.place(st);
    } else if (c.type === 'clear') {
      for (const g of [this.drawing, this.writing]) for (const n of [...g.children]) if (n.dataset.turtle === c.turtle) n.remove();
    } else if (c.type === 'background') {
      this.bg.setAttribute('fill', c.color);
    } else if (c.type === 'write') {
      const t = this.el('text', { x: c.position[0], y: c.position[1], fill: c.color, 'font-family': c.font[0], 'font-size': c.font[1], 'font-style': c.font[2], 'text-anchor': c.anchor, 'data-turtle': c.turtle });
      t.textContent = c.text; this.writing.appendChild(t);
    }
    return Promise.resolve();
  }
  tween(ms, gen, update) {
    if (ms <= 0) { update(1); return Promise.resolve(); }
    return new Promise(resolve => {
      const start = performance.now();
      const frame = now => {
        if (gen !== this.gen) { resolve(); return; }  // cleared or replaced meanwhile
        const p = Math.min(1, (now - start) / ms); update(p);
        if (p < 1) requestAnimationFrame(frame); else resolve();
      };
      requestAnimationFrame(frame);
    });
  }
  /* Draw commands[0 .. upto) at once (the step-through slider). `upto` omitted = all. */
  render(cmds, upto = cmds.length) { this.clear(); for (let i = 0; i < upto && i < cmds.length; i++) this.apply(cmds[i]); }
  /* How long one command takes. slow (speed 1): every step is watchable, at least 120 ms for
     a move and 60 ms for a turn, and a long program is squeezed only so the whole run stays
     under about 25 seconds. quick (3): four times faster, under about 6 seconds. 0 = instant. */
  pace(cmds) {
    if (!this.speed) return () => 0;
    const one = c => c.type === 'move' ? Math.max(120, Math.min(600, Math.hypot(c.to[0] - c.from[0], c.to[1] - c.from[1]) * 4))
      : c.type === 'rotate' ? Math.max(60, Math.min(300, Math.abs(c.to - c.from) * 3)) : 0;
    const total = cmds.reduce((a, c) => a + one(c), 0) || 1;
    const scale = Math.min(1, (this.speed === 1 ? 25000 : 6000) / total) / (this.speed === 1 ? 1 : 4);
    return c => one(c) * scale;
  }
  /* Animate commands one after another; `onStep(i)` runs before command i of this batch.
     Appends to what is on screen (an init command clears it). A batch that arrives while
     another is playing waits its turn, so a fast run of prompt lines never loses the tail
     of the drawing. Returns when the queue has drained, or false if it was interrupted
     by clear() / render() / stop(). */
  async play(cmds, onStep) {
    const ms = this.pace(cmds);
    cmds.forEach((c, i) => this.queue.push([c, ms(c), onStep, i]));
    if (this.playing) return true;
    this.playing = true;
    const gen = this.gen;
    try {
      while (this.queue.length) {
        if (gen !== this.gen) { this.queue.length = 0; return false; }
        const [c, t, cb, i] = this.queue.shift();
        if (cb) cb(i);
        await this.apply(c, t);
      }
    } finally { this.playing = false; }
    return gen === this.gen;
  }
  stop() { this.gen++; this.queue.length = 0; }
  /* The picture as a standalone SVG file. */
  toSVG() {
    const c = this.svg.cloneNode(true);
    c.setAttribute('xmlns', this.ns); c.setAttribute('width', 640); c.setAttribute('height', 480);
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + c.outerHTML;
  }
};
/* The command stream as geometry for grading, in turtle coordinates (x right, y up,
   degrees: positive = left turn). Zero-length moves (the turtle appearing) are left out. */
window.turtleCtx = function turtleCtx(cmds) {
  const segs = [], turns = [], fills = [], writes = [];
  let moves = 0;
  for (const c of cmds || []) {
    if (c.type === 'move') {
      const dx = c.to[0] - c.from[0], dy = c.to[1] - c.from[1], len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      moves++;
      if (c.drawing) segs.push({ x1: c.from[0], y1: -c.from[1], x2: c.to[0], y2: -c.to[1], len, color: c.color, width: c.width, line: c.line });
    } else if (c.type === 'rotate') {
      const d = -(c.to - c.from);  // SVG angles grow clockwise; turtle's grow anticlockwise
      if (Math.abs(d) > 1e-6) turns.push({ deg: d, line: c.line });
    } else if (c.type === 'polygon') fills.push({ points: c.points.map(([x, y]) => [x, -y]), fill: c.fill, line: c.line });
    else if (c.type === 'write') writes.push({ text: c.text, color: c.color, line: c.line });
  }
  // the library spells a few Tk colour names as hex for the browser; show the name the student typed
  const NAMES = { '#ffa500': 'orange', '#ffff00': 'yellow', '#ffffff': 'white', '#cd0000': 'red3', '#2e8b57': 'seagreen4', '#8b4789': 'orchid4', '#4876ff': 'royalblue1', '#104e8b': 'dodgerblue4' };
  const colors = [...new Set(segs.map(s => NAMES[s.color] || s.color))];
  return { cmds: cmds || [], segs, turns, fills, writes, moves, colors };
};
