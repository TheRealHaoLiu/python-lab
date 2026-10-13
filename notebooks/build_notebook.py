"""Builds hw5-tuples-and-lists.ipynb (and an answer-key copy) for Google Colab.

    python3 build_notebook.py            -> hw5-tuples-and-lists.ipynb
    python3 build_notebook.py --answers  -> hw5-tuples-and-lists-ANSWERS.ipynb

Edit the CELLS list below, then rebuild. Each code cell marks the student's
line with  ...  ; in the answer key that line is replaced by the answer.
"""
import json
import sys

SETUP = r'''# ▶ Run this cell first: click it, then press Shift+Enter.
# It sets up show(), which draws a tuple or list as a row of boxes.
from IPython.display import HTML, display

def show(seq, mark=()):
    """Draw seq as boxes: index on top, negative index underneath."""
    if not isinstance(seq, (list, tuple)):
        print(repr(seq))
        return
    is_list = isinstance(seq, list)
    color = "#c95a12" if is_list else "#4a43c8"
    border = "2px dashed" if is_list else "3px double"
    n = len(seq)
    cells = []
    for i, item in enumerate(seq):
        bg = "#ffe46b" if (i in mark or i - n in mark) else "white"
        cells.append(
            f'<td style="padding:0 4px;text-align:center;font-family:monospace;color:#555">'
            f'<div style="color:{color};font-weight:bold">{i}</div>'
            f'<div style="border:{border} {color};border-radius:8px;padding:10px 8px;min-width:70px;'
            f'background:{bg};color:#1b2440;font-family:sans-serif">{item!r}</div>'
            f'<div style="font-size:12px">{i - n}</div></td>')
    left, right = ("[", "]") if is_list else ("(", ")")
    kind = f"list · {n} items · can change" if is_list else f"tuple · {n} items · sealed"
    display(HTML(
        f'<div style="font-family:sans-serif;color:{color};font-weight:bold;margin:6px 0">{kind}</div>'
        f'<table style="border-collapse:separate"><tr>'
        f'<td style="font-size:44px;color:{color}">{left}</td>{"".join(cells)}'
        f'<td style="font-size:44px;color:{color}">{right}</td></tr></table>'))

print("Setup done ✓  Now scroll down to Q1.")
'''

# ("md", text) | ("code", source, answer_or_None)
# In code cells, the line containing "...  # ←" is the student's line.
CELLS = [
    ("md", """# Homework 5: Tuples & Lists

Two ways Python keeps things in a row:

| | **Tuple** `( )` | **List** `[ ]` |
|---|---|---|
| Read one item | `spells[0]` | `order[0]` |
| Slice a piece | `spells[0:2]` | `order[0:2]` |
| Count items | `len(spells)` | `len(order)` |
| Change, add, remove | ❌ error | ✅ `order[1] = ...`, `.append()`, `del` |

**How this notebook works**

1. Run each cell with **Shift + Enter**, from top to bottom.
2. In each task, replace the `...` with your code, then run the cell.
3. The `assert` line checks your answer. If it's right you'll see **✓ passed**. If not you'll see an `AssertionError` with a hint. Fix it and run the cell again.
4. When you're done, run the **Summary** cell at the bottom, then hand in the notebook in Google Classroom."""),
    ("code", SETUP, None),

    ("md", """---
## Q1: Magic Spell Book (50 points)

A wizard keeps their spell names in a **tuple**, because the spells never change."""),
    ("code", """spells = ('fireball', 'ice blast', 'thunder strike', 'healing light', 'shadow step')
show(spells)""", None),
    ("md", "**Task 1 (5 pts).** Print the whole tuple using `print(spells)`."),
    ("code", """...  # ← your line here

# (no assert for this one: just check that all five spells printed)""", "print(spells)"),
    ("md", "**Task 2 (10 pts).** Print just the second spell. Remember: Python starts counting at 0!"),
    ("code", """second = ...  # ← replace ... with your code
print(second)

assert second == 'ice blast', "Not yet. The first spell is at index 0."
print("✓ Task 2 passed")""", "second = spells[1]"),
    ("md", "**Task 3 (10 pts).** Print a slice showing the first three spells. A slice `[start:stop]` stops *before* the stop index."),
    ("code", """first_three = ...  # ← replace ... with your code
print(first_three)

assert first_three == ('fireball', 'ice blast', 'thunder strike'), "Not yet. Try spells[start:stop]."
print("✓ Task 3 passed")""", "first_three = spells[0:3]"),
    ("md", "**Task 4 (10 pts).** Print the last spell using negative indexing."),
    ("code", """last = ...  # ← replace ... with your code
print(last)

assert last == 'shadow step', "Not yet. spells[-1] counts one step back from the end."
print("✓ Task 4 passed")""", "last = spells[-1]"),
    ("md", """**Task 5 (15 pts).** A student tries to run `spells[0] = 'meteor'`. Run the cell below and read what Python says.

(The `try` / `except` lines just let the notebook keep going after the error.)"""),
    ("code", """try:
    spells[0] = 'meteor'
except Exception as error:
    print("Python says:", type(error).__name__ + ":", error)""", None),
    ("md", "What happened? Why? Write your answer as comments (lines starting with `#`) in the cell below."),
    ("code", """# My answer:
# ...  # ←""", "# Python stops with TypeError: 'tuple' object does not support item assignment.\n# Tuples are immutable, so their items can't be changed after they are made."),

    ("md", """---
## Q2: Treasure Chest Coordinates (40 points)

A pirate stores the coordinates of buried treasure in a **nested tuple**: a tuple of tuples. Each inner tuple holds one `(x, y)` location."""),
    ("code", """treasure = ((3, 5), (7, 2), (9, 8), (1, 4))
show(treasure)""", None),
    ("md", "**Task 1 (5 pts).** Print the entire treasure tuple."),
    ("code", """...  # ← your line here""", "print(treasure)"),
    ("md", "**Task 2 (10 pts).** Print the first coordinate pair using `treasure[0]`."),
    ("code", """first_pair = ...  # ← replace ... with your code
print(first_pair)

assert first_pair == (3, 5), "Not yet. Use treasure[0]."
print("✓ Task 2 passed")""", "first_pair = treasure[0]"),
    ("md", "**Task 3 (10 pts).** Print only the number 9 from the third coordinate pair. First get the third pair with `treasure[2]`, then add a second `[ ]` to get the first number inside it."),
    ("code", """nine = ...  # ← replace ... with your code
print(nine)

assert nine == 9, "Not yet. Two sets of brackets: treasure[pair][number]."
print("✓ Task 3 passed")""", "nine = treasure[2][0]"),
    ("md", "**Task 4 (10 pts).** Print a slice showing the first two coordinate pairs."),
    ("code", """first_two = ...  # ← replace ... with your code
print(first_two)

assert first_two == ((3, 5), (7, 2)), "Not yet. Same slicing as Q1: treasure[start:stop]."
print("✓ Task 4 passed")""", "first_two = treasure[0:2]"),
    ("md", "**Task 5 (5 pts).** Use `len(treasure)` to print how many coordinate pairs are in the tuple."),
    ("code", """how_many = ...  # ← replace ... with your code
print(how_many)

assert how_many == 4, "Not yet. Use len(treasure)."
print("✓ Task 5 passed")""", "how_many = len(treasure)"),

    ("md", """---
## Q3 (Bonus): Pizza Party Orders (50 points)

A pizza shop stores each order as a **list**, because orders change.

⚠️ These tasks build on each other. If the list gets messed up (for example you ran an `append` twice), run the next cell again to start the order over, then redo the tasks in order."""),
    ("code", """order = ['cheese pizza', 'garlic bread', 'soda', 'salad', 'brownie']
show(order)""", None),
    ("md", "**Task 1 (5 pts).** Print the whole order list."),
    ("code", """...  # ← your line here""", "print(order)"),
    ("md", "**Task 2 (5 pts).** Print just the third item."),
    ("code", """third = ...  # ← replace ... with your code
print(third)

assert third == 'soda', "Not yet. The third item is at index 2."
print("✓ Task 2 passed")""", "third = order[2]"),
    ("md", "**Task 3 (5 pts).** Change `'salad'` to `'chicken wings'` using indexing."),
    ("code", """...  # ← your line here
show(order)

assert order == ['cheese pizza', 'garlic bread', 'soda', 'chicken wings', 'brownie'], "Not yet. Which index holds 'salad'?"
print("✓ Task 3 passed")""", "order[3] = 'chicken wings'"),
    ("md", "**Task 4 (5 pts).** Add `'ice cream'` to the end of the list using `.append()`."),
    ("code", """...  # ← your line here
show(order)

assert order[-1] == 'ice cream' and len(order) == 6, "Not yet. Use order.append(...) once. If you ran it twice, restart the order (see the warning above)."
print("✓ Task 4 passed")""", "order.append('ice cream')"),
    ("md", "**Task 5 (10 pts).** The customer cancels the `'brownie'`. Remove it using `del order[4]`. Why does index 4 still point at the brownie?"),
    ("code", """...  # ← your line here
show(order)

assert 'brownie' not in order, "The brownie is still there."
assert order == ['cheese pizza', 'garlic bread', 'soda', 'chicken wings', 'ice cream'], "Something else got deleted. Restart the order and redo the tasks."
print("✓ Task 5 passed")""", "del order[4]"),
    ("md", "**Task 6 (5 pts).** Print the updated list after the deletion."),
    ("code", """...  # ← your line here""", "print(order)"),
    ("md", "**Task 7 (5 pts).** Print a slice showing the first three items of the updated list."),
    ("code", """first_three_items = ...  # ← replace ... with your code
print(first_three_items)

assert first_three_items == ['cheese pizza', 'garlic bread', 'soda'], "Not yet. Use a slice: order[start:stop]."
print("✓ Task 7 passed")""", "first_three_items = order[0:3]"),
    ("md", "**Task 8 (5 pts).** Print the last item using negative indexing."),
    ("code", """last_item = ...  # ← replace ... with your code
print(last_item)

assert last_item == 'ice cream', "Not yet. Count from the end with a negative index."
print("✓ Task 8 passed")""", "last_item = order[-1]"),
    ("md", "**Task 9 (5 pts).** Print how many items are in the list using `len(order)`."),
    ("code", """item_count = ...  # ← replace ... with your code
print(item_count)

assert item_count == 5, "Not yet. Use len(order)."
print("✓ Task 9 passed")""", "item_count = len(order)"),

    ("md", """---
## Summary

Run this last. It re-checks every answer without stopping at the first mistake, so you (and your teacher) can see everything at once."""),
    ("code", r'''checks = [
    ("Q1 task 2", lambda: second == 'ice blast'),
    ("Q1 task 3", lambda: first_three == ('fireball', 'ice blast', 'thunder strike')),
    ("Q1 task 4", lambda: last == 'shadow step'),
    ("Q2 task 2", lambda: first_pair == (3, 5)),
    ("Q2 task 3", lambda: nine == 9),
    ("Q2 task 4", lambda: first_two == ((3, 5), (7, 2))),
    ("Q2 task 5", lambda: how_many == 4),
    ("Q3 task 2", lambda: third == 'soda'),
    ("Q3 tasks 3-5", lambda: order == ['cheese pizza', 'garlic bread', 'soda', 'chicken wings', 'ice cream']),
    ("Q3 task 7", lambda: first_three_items == ['cheese pizza', 'garlic bread', 'soda']),
    ("Q3 task 8", lambda: last_item == 'ice cream'),
    ("Q3 task 9", lambda: item_count == 5),
]
passed = 0
for name, check in checks:
    try:
        ok = check()
    except NameError:
        ok = False   # that cell hasn't been run yet
    passed += ok
    print("✓" if ok else "✗", name)
print(f"\n{passed} / {len(checks)} checks passed.")
print("Tasks with print only (Q1 task 1, Q1 task 5, Q2 task 1, Q3 tasks 1 and 6) are checked by your teacher.")''', None),
]


def build(answers=False):
    cells = []
    for c in CELLS:
        if c[0] == "md":
            cells.append({"cell_type": "markdown", "metadata": {}, "source": c[1].splitlines(True)})
            continue
        _, src, ans = c
        if answers and ans is not None:
            lines = src.split("\n")
            for i, line in enumerate(lines):
                if "...  # ←" in line:
                    lines[i] = ans
                    break
            src = "\n".join(lines)
        cells.append({"cell_type": "code", "execution_count": None, "metadata": {}, "outputs": [],
                      "source": src.splitlines(True)})
    return {
        "cells": cells,
        "metadata": {
            "colab": {"provenance": [], "toc_visible": True},
            "kernelspec": {"display_name": "Python 3", "name": "python3"},
            "language_info": {"name": "python"},
        },
        "nbformat": 4, "nbformat_minor": 0,
    }


if __name__ == "__main__":
    answers = "--answers" in sys.argv
    name = "hw5-tuples-and-lists-ANSWERS.ipynb" if answers else "hw5-tuples-and-lists.ipynb"
    with open(name, "w") as f:
        json.dump(build(answers), f, indent=1, ensure_ascii=False)
    print("wrote", name)
