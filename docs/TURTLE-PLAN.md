# Turtle track — plan (draft 2026-11-03)

**Status 2026-11-03:** engine built and T6 (loops) + T1 (first steps) drafted at `site/turtle/`,
uncommitted. Spike passed: basthon-turtle 0.4.1 loads on the vendored Pyodide 0.26.4; the
homework pages hw5–8 are unchanged in behaviour (labkit regression harness + browser check).
Deviations from the plan below: no micropip (the six package files are written into the Pyodide
filesystem by the worker), labkit itself is the `basthon_turtle_transport` module (no JS transport),
commands come back with the run result and are replayed (no live streaming), the turtle step budget
is 8000 student lines (a runaway spiral stops in about a second), and the renderer is in-page SVG
(no iframe).

A second, separate set of lessons that teach the same topics as the teacher's course
(lectures 1–5, HW1–8) by drawing with `turtle` instead of printing text. Lives at
`site/turtle/`, next to the homework pages, never inside them.

## Why turtle fits this class

- The course follows *Python for Kids* (Briggs): lecture 4 = ch. 5, lecture 5 = ch. 6
  "Going Loopy", the wizard list / magic coins / hugehairypants examples are the book's.
  The book's **ch. 4 is "Drawing with Turtles"**, sitting between lists (ch. 3) and
  conditions (ch. 5). The teacher skipped it. This track restores the book's own chapter,
  not a foreign tool.
- Kids see the bug: a wrong angle is a wrong shape. `print` output needs reading; a
  square needs no explanation.
- Loops are where turtle pays off most: `for i in range(4): forward, left` *is* a square.
  Nested loop = a flower of squares. `while` = a spiral that grows until a limit.
- Works unchanged in IDLE on their Windows laptops (tkinter ships with python.org
  Python). **Invariant: every script on a turtle page runs identically in IDLE.** The
  teacher can live-code it in class; the page is where they practise and hand in.

## Separation from the homework pages

- `site/turtle/index.html` (its own list) and `site/turtle/t1/ … t6/` with
  `lesson.js` ids `turtle-1 …` (separate localStorage namespaces).
- `site/hw5–8/` are not touched. `site/index.html` gets one link to the turtle track
  (or none, until the teacher wants it — Hao's call).
- Shared engine changes are additive and gated: a page that sets `LESSON.turtle` loads
  the turtle wheel and the renderer; the homework pages pass nothing and run as today.
- No Colab notebook (Colab has no turtle; hw6+ already have none).

## The library: basthon-turtle 0.4.1

Hao's pointer ("turtle in the browser via SVG") matches **basthon-turtle**: a rewrite of
CPython's `turtle` that renders to SVG instead of Tk. Lineage: Brython's turtle → Basthon
(Romain Casati, framagit) → the `m-aciek/basthon-turtle` fork, which added a **Pyodide
mode** in 0.4.x (Sep 2026). That mode is exactly this site's architecture:

- Python runs in a Web Worker; the package calls a JS module `basthon_turtle_transport`
  with `emit(payload)` (one JSON turtle command) and `set_event_handler(h)` (for
  clicks/keys back into Python).
- The main thread keeps a persistent SVG renderer and animates the commands as they
  arrive, so a long program stays smooth (unlike running Python on the main thread).
- `from basthon.turtle._startup import install; install()` makes a plain
  `import turtle` pick this package — the kids' scripts stay `import turtle`.
- Pure Python wheel (`py3-none-any`), installed with micropip; we vendor the wheel under
  `site/vendor/basthon-turtle/` pinned, with its licence beside it, and read it before
  vendoring (pinned upstream = trust boundary). Nothing new in the CSP: SVG is inline,
  the wheel is `'self'`.
- **Licence: GPL-3.0-or-later.** python-lab has no LICENSE file. Vendoring the wheel +
  licence file is ordinary redistribution; our page speaks its postMessage protocol.
  Whether the repo gets a licence is Hao's decision, noted as an open question.

The example page `examples/pyodide/` in the repo is the reference host + worker. It pins
a newer Pyodide than our vendored 0.26.4; the wheel is pure Python so it should load, but
that is the first thing the spike proves.

Fallback if the spike fails: an own ~250-line `turtle.py` that emits the same command
stream to the same renderer contract. Lessons don't care which one is underneath.

## Engine work (one spike, then build)

**Spike (go/no-go, ~1 session):** vendor the wheel, run the upstream example against our
Pyodide 0.26.4 locally, then wire it into `py-worker.js` behind a boot flag. Confirm:

1. `forward/back/left/right/goto/setheading/circle/penup/pendown/color/pencolor/
   fillcolor/begin_fill/end_fill/width/speed/shape('turtle')/hideturtle/write/bgcolor`
   draw the same picture as IDLE (side-by-side screenshots for the lesson scripts).
2. `done()`, `mainloop()`, `exitonclick()`, `Screen()` are harmless no-ops (kids copy
   them from the book).
3. A `while True: t.forward(1)` is stopped by the existing step budget / 5 s timeout, the
   worker is killed and restarted, and the renderer survives (no stuck half-animation).
4. `input()` keeps working through the existing answer box.
5. Multiple `Pen()`s, and two runs in a row clear the canvas properly.

**Build:**

- `py-worker.js`: optional `LAB_BOOT.turtle = {wheel}` → register the transport module,
  micropip-install the vendored wheel, run the install shim, and **also keep a copy of
  every emitted command for the current run** so grading can see it.
- `site/turtle/js/turtle-view.js`: the SVG renderer (adapted from the upstream example;
  stays GPL, credited) + a **replay slider**: scrub the run one command at a time, with the
  source line that produced it highlighted (hw8's step-through idea, but with a picture).
  Speed control. "Download picture" (SVG).
- `labkit.py`: `run()` returns the command stream; grading helpers in the lesson's
  `c`: `c.segs` (drawn line segments with colour/width), `c.turns`, `c.fills`,
  `c.writes`, plus the existing `c.loops`, `c.ifs`, `c.notes`, `c.ran`. Commands carry
  the source line, so "the square must come from a loop" is `c.loops` + line attribution,
  as hw8 already does for prints.
- `lesson.js` check helpers: `polygon(c, sides, len, tol)` (closed, equal sides, right
  turns, order-free), `countSegs`, `colorsUsed`, `insideBox`. Expected values stay hidden
  as everywhere else: ✓ or "not yet" + hint.
- Practice boxes reuse the existing `cell` machinery with a small canvas that replays
  the student's try.
- Hand-in stays the `.txt` report (score, checks, each script, what it printed) plus the
  final SVG as a second download the teacher can open in any browser.

## Lesson map

Each lesson = a 10-minute warm-up the teacher live-codes in IDLE (the page's first
picture is that script), then the page for homework. Same shape as the teacher's: tasks
with points to 100 + a bonus, and one "a student writes this code — what is wrong?"
question per lesson. Build **T6 first** (current topic, biggest payoff), then T1, T3,
T5, T4, T2.

| # | Teacher's topic | Turtle lesson | Checks (hidden) |
|---|---|---|---|
| T1 | lec 1–2 / HW1–2: shell, variables, numbers | `import turtle; t = turtle.Pen()`; forward/left; `side = 100`; a square typed out four times; change `side` once and the whole square changes; bonus `side = int(input(...))` | square of side 100; square whose side is a variable; `/` vs `//` by drawing `100//3` vs `100/3` long lines |
| T2 | lec 2 / HW3: strings, `%s`, `.format` | `t.write()` a sign; `t.color('blue')` from a string variable; mad-libs sign with `%s`; `'ha' * 3` written under it | written text equals the formatted string; colour set from a variable |
| T3 | lec 3 / HW4–5: lists, tuples | `colors = ['red', 'blue', 'green', 'orange']` one side each by index; `potions[-1]` last side; treasure map `((3,5),(7,2),…)` scaled → `t.goto()` connect-the-dots; `del`/`.append()` changes the path; tuple can't be changed (`points[0] = …` → the same TypeError question) | sides coloured by index; path passes through the tuple points in order; list edit shows in the picture |
| T4 | HW6: dictionaries | `shapes = {'triangle': 3, 'square': 4, 'house': 5}` draw by name; `colors = {'sky': 'lightblue', 'grass': 'green'}`; add 'star': 5, `del` a key; dict of lists = one colour list per shape | polygon with `shapes[name]` sides; colours from the dict; `+` on two dicts is still the TypeError question |
| T5 | lec 4 / HW7: if/elif/else, and/or, None | `if side > 200: t.color('red')` (too big for the box); alternate colours `if i % 2 == 0`; `and` keeps the turtle inside a 120–200 band; `None` pen colour; `'10' == 10` | colour switches exactly at the boundary (probe values, like hw7's `probe`); path stays inside the box |
| T6 | lec 5 / HW8: for, range, while, nested | square with `for`; polygon with `range(sides)` and `360/sides`; "what does range(1,10) make" = 9 steps; the no-indent bug; spiral `while size < 300`; the "count never changes" turtle that walks forever (budget stops it); bonus: nested loop = 12 rotated squares; `break` when `t.xcor() > 250` | 4 segments from one `for`; n-gon from a `range` loop; spiral segments grow; nested = 12×4 segments; `break` stops at the wall |
| T7 | next (ch. 7 functions, then ch. 8 classes) | `def square(size):` then a row of squares; `def polygon(sides, size)`; classes = two `Pen()`s racing | — planned after the teacher's lecture 6 lands |

T2 (strings) is the weakest fit; it is still worth one page so the track is continuous,
but it could fold into T1 if Hao wants fewer pages.

## Open questions (none blocking the spike)

1. Linked from the landing page from day one, or kept unlinked until the teacher adopts it?
2. Audience first: Owen at home, or offered to the class like hw5–8 were?
3. Repo licence, given a GPL-3 wheel will be vendored.
4. Hand-in: `.txt` + `.svg`, or embed the picture in one HTML report?
