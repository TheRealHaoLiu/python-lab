# Python Lab

Interactive Python homework for a middle-school class, live at
<https://therealhaoliu.github.io/python-lab/>. Each homework comes in two forms.

| # | Homework | Page | Notebook |
|---|---|---|---|
| 8 | Loops (wizard's potion assembly line, magic coin counter, huge hairy pants) | [`hw8/`](https://therealhaoliu.github.io/python-lab/hw8/) | none |
| 7 | Flow Control (roller coaster height check, joke machine, secret word) | [`hw7/`](https://therealhaoliu.github.io/python-lab/hw7/) | none |
| 6 | Dictionaries (class pets, book shelf vs. sticker album, team rosters) | [`hw6/`](https://therealhaoliu.github.io/python-lab/hw6/) | none |
| 5 | Tuples & Lists (spell book, treasure map, pizza order) | [`hw5/`](https://therealhaoliu.github.io/python-lab/hw5/) | [Colab](https://colab.research.google.com/drive/1F3OSTM8XyNexynG4aKUC3kTzux_18rsO?usp=sharing) · source `notebooks/hw5-tuples-and-lists.ipynb` |
| 4 | Lists (potion ingredients, mixed backpack, your favourites) | [`hw4/`](https://therealhaoliu.github.io/python-lab/hw4/) | none |
| 3 | Strings with slots (Mad Libs blanks, joke generator; %s, .format() and f-strings) | [`hw3/`](https://therealhaoliu.github.io/python-lab/hw3/) | none |
| 2 | Variables (your name, area of a circle, input()) | [`hw2/`](https://therealhaoliu.github.io/python-lab/hw2/) | none |
| 1 | The Python shell (thirteen lines, types, operators) | [`hw1/`](https://therealhaoliu.github.io/python-lab/hw1/) | none |

Homeworks 1–4 were built after the fact (the class had passed them) so the whole course is
here for the next student. Their points per task are the pages' own; the postings gave none.

`site/hw9/` is an **unlisted draft** (not on the landing page, `noindex`): functions and modules,
written from the book's chapter 7 before the teacher posted Homework 9, to be reworded to the
real posting. It brings the function-machine picture (`js/app.js` buildFn: pick a function, type
the arguments, see what the body prints and what the call returns).

| | What it is | Python |
|---|---|---|
| `site/` | A static web page: clickable pictures, `assert` practice checks, a `homework.py` editor with syntax colouring and Tab completion, and a hand-in report | Real CPython 3.12 running in the browser ([Pyodide](https://pyodide.org)) |
| `notebooks/` | A Google Colab notebook with the same tasks, `assert` checks and a `show()` picture helper | Colab's own Python |

## The web page (`site/`)

Plain static files, with no build step and no server code. Students' code runs on their own
computer, in a Web Worker.

```
site/
  index.html        landing page: list of homeworks
  hw5/index.html    Homework 5 page markup (pictures, sections)
  hw5/lesson.js     Homework 5 content: questions, tasks, hidden checks, grading rules
  hw6/              Homework 6 (dictionaries), same layout
  hw7/              Homework 7 (if/elif/else, and/or, None): slider pictures instead of boxes
  hw8/              Homework 8 (for, range(), while, nested loops): step through a loop one turn at a time
  hw1/ … hw4/       Homeworks 1–4: shell transcript and type badges; variables as labels;
                    %s / .format() / f-string slot machine (js/app.js buildFmt); lists
  css/lab.css       shared styles (light and dark)
  js/config.js      where Pyodide comes from, run timeout
  js/app.js         shared page behaviour: pictures, editors, checks, report
  js/py-worker.js   loads Pyodide and labkit.py off the main thread
  py/labkit.py      Python side: runs code, formats errors like `python`, reports what a line touched
```

Try it locally (it must be served over http, not opened as a file):

```bash
python3 -m http.server 8000 --directory site
```

then open <http://localhost:8000> (Homework 5 is at `/hw5/`).

**Python source.** Pyodide 0.26.4 is committed under `site/vendor/pyodide/` (about 14 MB,
fetched once per student and cached). `scripts/vendor-pyodide.sh [version]` refreshes it.
`js/config.js` can point at the jsDelivr CDN instead (then add that host to the CSP).

**Editor.** CodeMirror 6, prebuilt into `site/vendor/codemirror.js` (MIT, licence alongside).
Rebuild with `cd editor-build && npm ci && npm run build`; versions are pinned in its
`package.json`.

**Security.** Students' code never reaches a server: it runs in their own browser, in a Web
Worker. A Content-Security-Policy `<meta>` tag in `index.html` limits the page (and the
worker, which is started from a `blob:` URL so it inherits the policy) to this site's own
files, so student code can't make the browser talk to other sites. Don't run students'
scripts with Python on your own computer; paste them into the page instead.

**Hosting.** Any static file server works (this repo deploys to GitHub Pages with
`.github/workflows/pages.yml`). Serve `.wasm` as `application/wasm`.

**input().** A page can't pause Python to wait for typing, so a question can set `ask`:
homework.py gets an *input() answer* box next to Run, and each `input()` takes the next answer
(comma-separated), echoed after the prompt like a terminal. With no answer left, `input()` raises
`EOFError`, as Python does with no keyboard.

**Grading if statements.** A question with `probe: {var, values}` has every top-level `if`
statement in homework.py run on its own once per value (`labkit.branches`). Checks then ask
"does some `if` print X for exactly the right values", so `>` vs `>=` and `age == 10 or 11`
fail, and a later `height = 130` can't mask an earlier condition. A task's check sees only the
`if` statements under its own starter heading (`under: [n, …]` widens that), so one task's
code can't pass another. The practice box for such a task (`cell: {prog}`) takes the task's
code itself and runs it once per value, naming the first value where the output is wrong.

**Loops (Homework 8).** A question with `loop: {programs, watch, tester}` gets a picture that
steps through a program one turn at a time (`labkit.trace`): the loop line shows the loop
variable's value, the body lights up, the output grows, and the drawn list's box lights up; a
loop inside a loop gets its own strip. A `while` still True after 60 turns is shown as endless.
The `for x in …` box (`labkit.seq`) draws every value a `range()` or list would give. Grading
sees `c.loops`: each top-level `for`/`while` under the task's heading with what it printed,
its `iter`/`test` text and nesting `depth`; a prog cell may expect a list of lines, and its
`probe` runs the student's loop with a second list or number so hand-typed prints don't pass.

**Runaway code.** Student code runs under a step budget (`labkit.Budget`, 20 000 line
events): a `while` that never ends stops with `LoopLimit` and its output so far, and the page
keeps running. Each run is also stopped after `timeoutMs` (5 s). Then the worker is killed and
Python restarts, so `while True:` can't freeze the page.

**Student data.** Code, check inputs, names and scores live in the student's own browser
(`localStorage`). Nothing is sent anywhere. The hand-in report is a `.txt` file: score and checks at the top, then each script and what it printed.

**Adding a homework.** Copy `site/hw6/` to `site/hwN/`, give `lesson.js` a new `id` (it
namespaces each student's saved work) and title, and add it to the list in `site/index.html`.
The lesson format is documented at the top of `site/hw6/lesson.js`. Pictures can draw lists,
tuples and dictionaries (including lists inside either), and a question can show more than
one variable (`vars`). The slice explorer and treasure map in `js/app.js` switch on only
when a page has their markup (Homework 5).

## The Colab notebook (`notebooks/`)

* `hw5-tuples-and-lists.ipynb`: the student copy. Every task has a `...` to replace and an
  `assert` with a hint.
* `build_notebook.py`: edit the cells here, then run `python3 build_notebook.py`.

In Google Classroom, create an assignment, attach the `.ipynb` from Drive and choose
**Make a copy for each student**. Students open it with Colab. The **Summary** cell at the
end re-checks everything without stopping at the first mistake, and the teacher can read the
saved outputs without running anything. Some schools turn Colab off for younger students, so
check with the teacher first.

No answers are shown on the page or kept in this repo; the checks only say ✓ or "not yet".
