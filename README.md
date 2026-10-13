# Python Lab

Interactive Python homework for a middle-school class, live at
<https://therealhaoliu.github.io/python-lab/>. Each homework comes in two forms.

| # | Homework | Page | Notebook |
|---|---|---|---|
| 5 | Tuples & Lists (spell book, treasure map, pizza order) | [`hw5/`](https://therealhaoliu.github.io/python-lab/hw5/) | `notebooks/hw5-tuples-and-lists.ipynb` |

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

**Runaway code.** Each run is stopped after `timeoutMs` (5 s). The worker is killed and
Python restarts, so `while True:` can't freeze the page.

**Student data.** Code, check inputs, names and scores live in the student's own browser
(`localStorage`). Nothing is sent anywhere. The hand-in report is a `.txt` file: score and checks at the top, then each script and what it printed.

**Adding a homework.** Copy `site/hw5/` to `site/hwN/`, give `lesson.js` a new `id` (it
namespaces each student's saved work) and title, and add it to the list in `site/index.html`.
The lesson format is documented at the top of `lesson.js`. Some picture code in `js/app.js`
(slice explorer, treasure map, pizza sync) is still specific to Homework 5.

## The Colab notebook (`notebooks/`)

* `hw5-tuples-and-lists.ipynb`: the student copy. Every task has a `...` to replace and an
  `assert` with a hint.
* `hw5-tuples-and-lists-ANSWERS.ipynb`: the answer key, built locally and kept out of git
  (`python3 build_notebook.py --answers`). Every cell passes.
* `build_notebook.py`: edit the cells here, then run `python3 build_notebook.py` and
  `python3 build_notebook.py --answers`.

In Google Classroom, create an assignment, attach the `.ipynb` from Drive and choose
**Make a copy for each student**. Students open it with Colab. The **Summary** cell at the
end re-checks everything without stopping at the first mistake, and the teacher can read the
saved outputs without running anything. Some schools turn Colab off for younger students, so
check with the teacher first.
