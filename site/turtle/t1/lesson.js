/* Turtle lesson 1: first steps and variables (lectures 1–2, homework 1–2), drawn with the turtle.
   Lesson format: see turtle/t6/lesson.js. */
(function () {
  const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
  const chain = segs => segs.every((s, i) => !i || (near(s.x1, segs[i - 1].x2, 1) && near(s.y1, segs[i - 1].y2, 1)));
  const closed = segs => segs.length > 2 && near(segs[segs.length - 1].x2, segs[0].x1, 2) && near(segs[segs.length - 1].y2, segs[0].y1, 2);
  const polygon = (segs, n, len) => segs.length === n && chain(segs) && closed(segs) && segs.every(s => near(s.len, len));
  const allTurns = (turns, deg) => turns.length > 0 && turns.every(t => near(Math.abs(t.deg), deg, 0.5));
  const PEN = 'import turtle\nt = turtle.Pen()';
  const SETS = (name, v) => new RegExp(`^\\s*${name}\\s*=\\s*${v}\\s*$`, 'm');
  // the square's sides are the variable, not the number: the code names side and never writes the number itself
  const usesVar = (input, name, v) => new RegExp(`\\b${name}\\b`).test(input.replace(SETS(name, '\\d+'), '')) && !new RegExp(`forward\\s*\\(\\s*${v}\\s*\\)`).test(input);

  window.LESSON = {
    id: 'turtle-1',
    title: 'Turtle 1: First Steps & Variables',
    turtle: true,
    questions: [
      {
        id: 'q1', title: 'Meet the Turtle', var: 't', init: () => null,
        setup: PEN,
        turtle: {
          programs: [
            { label: 'A line', code: 't.forward(100)' },
            { label: 'A corner', code: 't.forward(100)\nt.left(90)\nt.forward(100)' },
            { label: 'A square by hand', code: 't.forward(100)\nt.left(90)\nt.forward(100)\nt.left(90)\nt.forward(100)\nt.left(90)\nt.forward(100)\nt.left(90)' },
            { label: 'Backwards and right', code: 't.forward(100)\nt.right(90)\nt.forward(50)\nt.backward(100)' },
            { label: 'Try: a typo', code: 't.forwrd(100)' },
          ],
        },
        starter: `import turtle
t = turtle.Pen()

# 1. Draw a line 100 long: t.forward(100).


# 2. Turn left 90 degrees and draw another line 100 long.


# 3. Finish the square: two more turns and two more lines, so the turtle
#    is back where it started.


# 4. A student writes t.forwrd(100). What happens? Why?
#    Write your answer as comments below.


# 5. Move the turtle to the right side of the screen WITHOUT drawing a line
#    (hint: t.penup(), then t.forward, then t.pendown()), then draw a line 50 long.
`,
        tasks: [
          {
            pts: 10, text: 'Draw a line 100 long with <code>t.forward(100)</code>.',
            hint: 'Pick <em>A line</em> in the picture and press Play. The turtle starts in the middle facing right, and forward means “walk that way”.',
            cell: { draw: x => x.segs.length === 1 && near(x.segs[0].len, 100) ? true : !x.segs.length ? 'Nothing was drawn. Is the pen down and the number inside the brackets?' : x.segs.length > 1 ? 'Just one line for this task.' : `That line is ${Math.round(x.segs[0].len)} long; the task says 100.`, label: '# t is already a turtle. Type one line of Python:', ph: 't.forward(…)', anchor: '# 1. Draw a line 100 long: t.forward(100).' },
            check: c => c.segs.length === 1 && near(c.segs[0].len, 100),
          },
          {
            pts: 10, text: 'Turn left 90 degrees with <code>t.left(90)</code>, then draw another line 100 long.',
            hint: 'Pick <em>A corner</em> in the picture and step through it. Left is the turtle\'s left: it turns to face up.',
            cell: { draw: x => x.segs.length === 1 && near(x.segs[0].len, 100) && allTurns(x.turns, 90) && x.turns[0].deg > 0 ? true : !x.turns.length ? 'Turn first: t.left(90).' : x.turns[0].deg < 0 ? 'That turns right. The task says left.' : !allTurns(x.turns, 90) ? 'A corner is a 90 degree turn.' : 'Then one line 100 long.', label: '# The turtle has just drawn task 1. Type the turn, then the line:', ph: 't.left(…)\nt.forward(…)', anchor: '# 2. Turn left 90 degrees and draw another line 100 long.' },
            check: c => c.segs.length === 1 && near(c.segs[0].len, 100) && allTurns(c.turns, 90) && c.turns[0].deg > 0,
          },
          {
            pts: 15, text: 'Finish the square: two more turns and two more lines, so the turtle is back where it started.',
            hint: 'Pick <em>A square by hand</em> and watch: forward, left, forward, left, forward, left, forward, left. Every side is 100, every turn is 90.',
            cell: { draw: x => polygon(x.segs, 4, 100) && allTurns(x.turns, 90) ? true : x.segs.length !== 4 ? `That draws ${x.segs.length} line${x.segs.length === 1 ? '' : 's'}. A square needs 4.` : !allTurns(x.turns, 90) ? 'Each corner is a 90 degree turn.' : 'The turtle should end where it started: four sides of 100, four turns of 90.', label: '# Type the whole square: four lines, four turns:', ph: 't.forward(100)\nt.left(90)\n…', anchor: '#    is back where it started.' },
            check: c => polygon(c.segs, 4, 100), under: [1, 2, 3],
          },
          {
            pts: 10, text: 'A student writes <code>t.forwrd(100)</code>. What happens? Why? Answer in comments (lines starting with <code>#</code>).',
            hint: 'Pick <em>Try: a typo</em> in the picture, or run it below, and read the error. Python only knows the names it was given: forward, not forwrd.',
            cell: { why: true, tryCode: 't.forwrd(100)', re: /attributeerror|error|spell|typo|forward|no such|doesn'?t (exist|know)|not (a|an|the) (method|command|name|word)|wrong name|misspel/, whyHint: 'Say what Python does (the error name) and why: is forwrd a word the turtle knows?', anchor: '#    Write your answer as comments below.' },
            check: c => /attributeerror|error|spell|typo|forward|no such|doesn'?t (exist|know)|not (a|an|the) (method|command|name|word)|wrong name|misspel/i.test(c.notes(4)), doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'Move the turtle to the right <em>without</em> drawing (<code>t.penup()</code>, <code>t.forward(150)</code>, <code>t.pendown()</code>), then draw a line 50 long.',
            hint: 'With the pen up the turtle walks but leaves no line. Put the pen down before the line you want to see.',
            cell: { draw: x => x.segs.length === 1 && near(x.segs[0].len, 50) && x.moves >= 2 ? true : x.segs.length === 2 ? 'Two lines were drawn: the first walk should have the pen up.' : !x.segs.length ? 'No line at all: put the pen down (t.pendown()) before the last forward.' : x.moves < 2 ? 'Walk first with the pen up, then draw.' : `The drawn line should be 50 long.`, label: '# Pen up, walk, pen down, draw:', ph: 't.penup()\nt.forward(150)\nt.pendown()\nt.forward(50)', anchor: '#    (hint: t.penup(), then t.forward, then t.pendown()), then draw a line 50 long.' },
            check: c => c.segs.length === 1 && near(c.segs[0].len, 50) && /penup/.test(c.code),
          },
        ],
      },
      {
        id: 'q2', title: 'Variables Are Labels', var: 't', vars: ['t', 'side'], init: () => ({ t: null, side: 100 }),
        setup: PEN + '\nside = 100',
        turtle: {
          programs: [
            { label: 'A square from side', code: 'side = 100\nt.forward(side)\nt.left(90)\nt.forward(side)\nt.left(90)\nt.forward(side)\nt.left(90)\nt.forward(side)\nt.left(90)' },
            { label: 'Change side once', code: 'side = 40\nt.forward(side)\nt.left(90)\nt.forward(side)\nt.left(90)\nt.forward(side)\nt.left(90)\nt.forward(side)\nt.left(90)' },
            { label: 'Area, printed', code: 'side = 100\nt.forward(side)\nt.left(90)\nt.forward(side)\narea = side * side\nprint("area =", area)' },
            { label: '100/3 and 100//3', code: 't.forward(100/3)\nt.left(90)\nt.forward(100//3)\nprint(100/3)\nprint(100//3)' },
          ],
        },
        ask: '80',
        starter: `import turtle
t = turtle.Pen()

# 1. Make a variable called side with the value 150, then draw a square
#    whose four sides are all t.forward(side). Use the variable, not the number.


# 2. Work out the area of that square in a variable called area
#    (area = side * side) and print it.


# 3. Draw a line t.forward(100/3) and then, after t.left(90), a line t.forward(100//3).
#    Then print both numbers: print(100/3) and print(100//3).
#    What is the difference between / and //? Write your answer as comments below.


# 4. Bonus: ask the user for the side with input() and draw a square that size:
#        side = int(input("How long is a side? "))
`,
        tasks: [
          {
            pts: 15, text: 'Make a variable called <code>side</code> with the value 150, then draw a square whose four sides are all <code>t.forward(side)</code>. Use the variable, not the number.',
            hint: 'Pick <em>A square from side</em>, then <em>Change side once</em>: one number changed at the top, and the whole square changed with it. That is what a variable is for.',
            cell: { draw: (x, input) => polygon(x.segs, 4, 150) && usesVar(input, 'side', 150) ? true : !SETS('side', '150').test(input) ? 'Start with side = 150.' : !usesVar(input, 'side', 150) ? 'Use t.forward(side) for every side, not the number.' : x.segs.length !== 4 ? `That draws ${x.segs.length} line${x.segs.length === 1 ? '' : 's'}. A square needs 4.` : 'Four sides of side, four turns of 90.', label: '# Set side, then draw the square with it:', ph: 'side = 150\nt.forward(side)\nt.left(90)\n…', anchor: '#    whose four sides are all t.forward(side). Use the variable, not the number.' },
            check: c => polygon(c.segs, 4, 150) && usesVar(c.code, 'side', 150),
          },
          {
            pts: 10, text: 'Work out the area of that square in a variable called <code>area</code> (<code>area = side * side</code>) and print it.',
            hint: 'Pick <em>Area, printed</em> in the picture. The square has side 150, so the print shows 150 times 150.',
            cell: { draw: (x, input, printed) => printed.includes('22500') && /\barea\s*=/.test(input) ? true : !/\barea\s*=/.test(input) ? 'Make a variable called area first.' : printed.length ? `It printed ${printed.join(', ')}; 150 times 150 is something else.` : 'Nothing printed: print(area).', setup: PEN + '\nside = 150', label: '# side is 150 here. Make area and print it:', ph: 'area = …\nprint(area)', anchor: '#    (area = side * side) and print it.' },
            check: c => c.printed('22500') && /\barea\s*=/.test(c.code),
          },
          {
            pts: 15, text: 'Draw a line <code>t.forward(100/3)</code>, turn left 90, then a line <code>t.forward(100//3)</code>. Print both numbers. What is the difference between <code>/</code> and <code>//</code>? Answer in comments.',
            hint: 'Pick <em>100/3 and 100//3</em> and look at the two printed numbers. One has a decimal point. The two lines are almost the same length: 33.333… and 33.',
            cell: { why: true, tryCode: 't.forward(100/3)\nt.left(90)\nt.forward(100//3)\nprint(100/3)\nprint(100//3)', re: /decimal|point|whole|integer|int\b|float|round|33\.3|remainder|cut|drop|floor|exact/, label: '# What is the difference between / and //?', ph: '/ gives … and // gives …', whyHint: 'Say what each one prints and what kind of number that is (a decimal, or a whole number).', anchor: '#    What is the difference between / and //? Write your answer as comments below.' },
            check: c => c.printedAny(['33.333333333333336', '33.33333333333333']) && c.printed('33') && c.segs.some(s => near(s.len, 33.33, 0.2)) && c.segs.some(s => near(s.len, 33, 0.2)) && /decimal|point|whole|integer|int\b|float|round|33\.3|remainder|cut|drop|floor|exact/i.test(c.notes(3)), doneLabel: 'checked (teacher grades the explanation)',
          },
          {
            pts: 10, text: 'Bonus: ask the user for the side with <code>input()</code> and draw a square that size: <code>side = int(input("How long is a side? "))</code>. The <em>input() answer</em> box next to Run is what the user types.',
            hint: 'input() gives you text; int() turns it into a number the turtle can walk. Then the square is the same four lines as task 1.',
            cell: { why: true, ok: s => /int\s*\(\s*input/.test(s) && /forward\s*\(\s*side\s*\)/.test(s), label: '# Type your bonus code here (the check box can\'t ask questions, so just write it; the real test is homework.py):', ph: 'side = int(input("How long is a side? "))\n…', rows: 5, okMsg: '✓ looks right. Put it in homework.py, set the input() answer, and press Run.', whyHint: 'Use int(input(...)) to get side, then t.forward(side) four times.', anchor: '#        side = int(input("How long is a side? "))' },
            check: c => /int\s*\(\s*input/.test(c.code) && polygon(c.segs, 4, 80), under: [4],
          },
        ],
      },
    ],
  };
})();
