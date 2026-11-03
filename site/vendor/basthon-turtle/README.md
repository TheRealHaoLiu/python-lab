# basthon-turtle (vendored)

Python's `turtle` module rewritten to draw SVG instead of a Tk window, so the kids'
turtle scripts run unchanged in the browser (Pyodide) on the turtle pages.

- Project: https://github.com/m-aciek/basthon-turtle (Maciej Olko), a fork of Basthon's
  turtle by Romain Casati, itself a port of Brython's turtle module.
- Version: 0.4.1, commit f7ee929 (2026-10-16). Files under `basthon/turtle/` are copied
  verbatim from the repository's `basthon/turtle/`.
- Licence: GPL-3.0-or-later (`LICENSE` beside this file). The upstream notices are kept
  in the source files.

How the page uses it: `js/py-worker.js` writes these files into the Pyodide filesystem
and `py/labkit.py` registers the small `basthon_turtle_transport` module the package
looks for, so every turtle command becomes one JSON record the page draws
(`turtle/turtle-view.js`). Nothing else of the package's browser tooling is used.

To refresh: copy the six `.py` files from the tagged release, update this note.
