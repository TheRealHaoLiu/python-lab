/* Turtle lesson 6: loops (for, range(), while, a loop inside a loop), drawn with the turtle.
   Same shape as hw8/lesson.js, with:
     turtle   – the page has a turtle (app.js loads the module and draws commands)
     q.turtle – {programs: [{label, code}]}: sample programs for the picture (play / step through)
     cell.draw(ctx, input) – a practice check that looks at what the code drew:
              ctx = {segs, turns, fills, writes, colors, moves} in turtle coordinates;
              return true (pass), false, or a sentence as the hint
   Grading helpers on c (homework.py): c.segs, c.turns, c.fills, c.writes (only the ones
   drawn under the task's own starter heading), plus c.loops as in hw8. */
(function () {
  const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
  // the lines join end to start, in order, and the last one ends where the first began
  const chain = segs => segs.every((s, i) => !i || (near(s.x1, segs[i - 1].x2, 1) && near(s.y1, segs[i - 1].y2, 1)));
  const closed = segs => segs.length > 2 && near(segs[segs.length - 1].x2, segs[0].x1, 2) && near(segs[segs.length - 1].y2, segs[0].y1, 2);
  const polygon = (segs, n, len) => segs.length === n && chain(segs) && closed(segs) && segs.every(s => near(s.len, len));
  const lengths = (segs, want) => segs.length === want.length && chain(segs) && segs.every((s, i) => near(s.len, want[i]));
  const allTurns = (turns, deg) => turns.length > 0 && turns.every(t => near(Math.abs(t.deg), deg, 0.5));
  // the lines were drawn by a for/while loop under this task (not typed out one by one)
  const byLoop = (c, pred = () => true) => c.segs.length > 0 && c.loops.some(l => pred(l) && c.segs.every(s => s.line >= l.line && s.line <= l.end));
  const RANGE = (a, b) => new RegExp(`^range\\(\\s*${a}\\s*(,\\s*${b}\\s*)?\\)$`);
  const RANGE_TYPED = (a, b) => new RegExp(`range\\s*\\(\\s*${a}\\s*${b == null ? '' : ',\\s*' + b + '\\s*'}\\)`);
  const NO_INDENT = [/^(for|while)[^\n]*:\s*\n(?!\s)/m, 'The lines under for or while must be indented 4 spaces.'];
  const FOR = [/\bfor\b/, 'That draws it, but the task asks for a for loop.'];
  const WHILE = [/\bwhile\b/, 'That draws it, but the task asks for a while loop.'];
  const SPIRAL = n => { const a = []; for (let k = 1; k <= n; k++) a.push(k * 10); return a; };
  const RANGE9 = text => {
    const t = text.replace(/range\s*\(\s*1\s*,\s*10\s*\)/gi, ' ');
    const s = (t.match(/\d+/g) || []).join(',');
    return (s.includes('1,2,3,4,5,6,7,8,9') && !s.includes('1,2,3,4,5,6,7,8,9,10')) || /\b1\s*(to|-|–|through|up to|till|until)\s*9\b/i.test(t);
  };
  const PEN = 'import turtle\nt = turtle.Pen()';

  window.LESSON = {
    id: 'turtle-6',
    title: 'Turtle 6: Loops',
    turtle: true,
    questions: [
      {
        id: 'q1', title: 'Square Dance', var: 't', init: () => null,
        setup: PEN,
        turtle: {
          programs: [
            { label: 'Four lines by hand', code: 't.forward(100)\nt.left(90)\nt.forward(100)\nt.left(90)\nt.forward(100)\nt.left(90)\nt.forward(100)\nt.left(90)' },
            { label: 'Square with a for loop', code: 'for i in range(4):\n    t.forward(100)\n    t.left(90)' },
            { label: 'Triangle: 3 turns of 120', code: 'for i in range(3):\n    t.forward(120)\n    t.left(120)' },
            { label: 'Colours from a list', code: "colors = ['red', 'blue', 'green', 'orange']\nfor c in colors:\n    t.color(c)\n    t.forward(100)\n    t.left(90)" },
            { label: 'Try: no indent', code: 'for i in range(4):\nt.forward(100)' },
          ],
        },
        starter: `import turtle
t = turtle.Pen()

# 1. Write a for loop using range(4) that draws a square with sides of 100.
#    Each turn: t.forward(100), then t.left(90).


# 2. Write a for loop using range(1, 6) that draws a square spiral:
#    each turn, t.forward(n * 20) and then t.left(90), where n is the loop variable.


# 3. If the loop in task 2 used range(1, 10) instead, which numbers would n be?
#    List them as a comment below, and say how many lines that draws.


# 4. A student writes this code:
#        for i in range(4):
#        t.forward(100)
#    What is wrong with this code? What will happen when it runs?
#    Write your answer as comments below.


# 5. Rewrite the code from task 4 so it runs correctly.


# 6. A student writes:
#        colors = ['red', 'blue', 'green']
#        for i in range(0, 3):
#            t.color(colors[i])
#            t.forward(100)
#            t.left(120)
#    What will this draw? Explain why colors[i] works inside the loop.
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 10, text: 'Write a <code>for</code> loop using <code>range(4)</code> that draws a square with sides of 100. Each turn: <code>t.forward(100)</code>, then <code>t.left(90)</code>.',
            hint: 'Pick <em>Four lines by hand</em> in the picture, then <em>Square with a for loop</em>: same drawing, two lines instead of eight. The two turtle lines go inside the block, indented 4 spaces.',
            cell: { draw: (x, input) => polygon(x.segs, 4, 100) ? true : x.segs.length !== 4 ? `That draws ${x.segs.length} line${x.segs.length === 1 ? '' : 's'}. A square needs 4.` : !allTurns(x.turns, 90) ? 'The corners of a square are 90° turns.' : closed(x.segs) ? 'Each side should be 100 long.' : 'The turtle should end up back where it started: four sides, four turns.', label: '# t is already a turtle. Type the for loop:', ph: 'for … in range(…):\n    t.forward(…)\n    t.left(…)', must: FOR, traps: [NO_INDENT], anchor: '#    Each turn: t.forward(100), then t.left(90).' },
            check: c => polygon(c.segs, 4, 100) && byLoop(c, l => l.kind === 'for' && RANGE(4).test(l.iter || '')),
          },
          {
            pts: 10, text: 'Write a <code>for</code> loop using <code>range(1, 6)</code> that draws a square spiral: each turn, <code>t.forward(n * 20)</code> and then <code>t.left(90)</code>, where <code>n</code> is the loop variable.',
            hint: '<code>range(1, 6)</code> makes 1, 2, 3, 4, 5: it stops before the second number. So the lines are 20, 40, 60, 80 and 100 long. Type <code>range(1, 6)</code> and the loop variable name you chose in place of <code>n</code>.',
            cell: { draw: x => lengths(x.segs, [20, 40, 60, 80, 100]) ? true : x.segs.length === 6 ? 'That is 6 lines. range(1, 6) stops before 6, so it should make 5 turns.' : x.segs.length !== 5 ? `That draws ${x.segs.length} line${x.segs.length === 1 ? '' : 's'}; range(1, 6) gives 5 turns.` : 'The lines should be 20, 40, 60, 80 and 100 long, in that order: forward(n * 20).', label: '# Type the for loop, using range(1, 6):', ph: 'for n in range(…):\n    t.forward(n * 20)\n    t.left(90)', must: [RANGE_TYPED(1, 6), 'Right spiral, but the task asks you to use range(1, 6).'], traps: [NO_INDENT], anchor: '#    each turn, t.forward(n * 20) and then t.left(90), where n is the loop variable.' },
            check: c => lengths(c.segs, [20, 40, 60, 80, 100]) && byLoop(c, l => l.kind === 'for' && RANGE(1, 6).test(l.iter || '')),
          },
          {
            pts: 10, text: 'If the loop in task 2 used <code>range(1, 10)</code> instead, which numbers would <code>n</code> be? List them, and say how many lines that draws.',
            hint: 'The second number is where it stops, and it is not included. Run the line below and count the lines in the picture.',
            cell: { why: true, ok: s => RANGE9(s) && /\b9\b|nine/i.test(s), tryCode: 'for n in range(1, 10): t.forward(n * 20); t.left(90)', label: '# Your guess: which numbers does range(1, 10) make, and how many lines is that?', ph: '1, 2, … so … lines', rows: 1, okMsg: '✓ right! Run the line to see the spiral grow one turn at a time.', whyHint: 'List every number it makes, in order, stop where range stops, and count them.', anchor: '#    List them as a comment below, and say how many lines that draws.' },
            check: c => { const n = c.notes(3); return RANGE9(n) && /\b9\b|nine/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: 'A student writes this code:<pre>for i in range(4):\nt.forward(100)</pre>What is wrong with this code? What will happen when it runs? Answer in comments (lines starting with <code>#</code>).',
            hint: 'Pick <em>Try: no indent</em> in the picture, or run it below, and read the name of the error. Then look at the line in front of <code>t.forward</code>.',
            cell: { why: true, tryCode: 'for i in range(4):\nt.forward(100)', re: /indent|space|tab/, whyHint: 'Say what Python does (the error) and what is missing in front of t.forward.', anchor: '#    Write your answer as comments below.' },
            check: c => /indent|space|tab/i.test(c.notes(4)), doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'Rewrite the code from task 4 so it runs correctly.',
            hint: 'Keep the same two lines. Only one of them needs to change. With no turn, the four lines make one long line of 400.',
            cell: { draw: x => x.segs.length === 4 && x.segs.every(s => near(s.len, 100)) ? true : x.segs.length === 1 && near(x.segs[0].len, 100) ? 'Only one line of 100 was drawn: is t.forward inside the loop?' : 'It should draw four lines of 100, one after another.', start: 'for i in range(4):\nt.forward(100)', label: '# The code from task 4. Fix it so it runs:', must: [RANGE_TYPED(4), "Keep the student's range(4)."], anchor: '# 5. Rewrite the code from task 4 so it runs correctly.' },
            check: c => c.ran && c.segs.length === 4 && c.segs.every(s => near(s.len, 100)) && byLoop(c, l => l.kind === 'for' && RANGE(4).test(l.iter || '')),
          },
          {
            pts: 5, text: 'A student writes:<pre>colors = [\'red\', \'blue\', \'green\']\nfor i in range(0, 3):\n    t.color(colors[i])\n    t.forward(100)\n    t.left(120)</pre>What will this draw? Explain why <code>colors[i]</code> works inside the loop.',
            hint: 'Step through <em>Colours from a list</em> in the picture, then think: what is <code>i</code> on each turn, and what does <code>colors[0]</code> mean?',
            cell: { why: true, tryCode: "colors = ['red', 'blue', 'green']\nfor i in range(0, 3):\n    t.color(colors[i])\n    t.forward(100)\n    t.left(120)", re: /triangle|three|3 (lines|sides)|index|position|number|spot|place|\b[012]\b/, label: '# What does it draw, and why does colors[i] work?', ph: 'It draws … because i is …', whyHint: 'Name the shape and its colours, and say what i is on each turn and which colour colors[i] picks.', anchor: '#    What will this draw? Explain why colors[i] works inside the loop.' },
            check: c => { const n = c.notes(6); return n.length >= 15 && /triangle|three|3 (lines|sides)|index|position|number|spot|place|\b[012]\b/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
      {
        id: 'q2', title: 'The Growing Spiral', var: 't', vars: ['t', 'size'], init: () => ({ t: null, size: 10 }),
        setup: PEN + '\nsize = 10',
        turtle: {
          programs: [
            { label: 'Grow with for', code: 'size = 10\nfor turn in range(1, 11):\n    t.forward(size)\n    t.left(90)\n    size = size + 10' },
            { label: 'Until 200 (while)', code: 'size = 10\nwhile size < 200:\n    t.forward(size)\n    t.left(90)\n    size = size + 10' },
            { label: 'Try: size never changes', code: 'size = 10\nwhile size < 200:\n    t.forward(size)\n    t.left(90)' },
            { label: 'Fixed: size + 10', code: 'size = 10\nwhile size < 200:\n    t.forward(size)\n    t.left(90)\n    size = size + 10\nprint("size is now", size)' },
          ],
        },
        starter: `import turtle
t = turtle.Pen()
size = 10

# 1. Write a for loop using range(1, 11) that draws a spiral: each turn,
#    t.forward(size), then t.left(90), then size = size + 10.


# 2. In your own words: what does
#        size = size + 10
#    do each turn? Write your answer as comments below.


# 3. A student wants the spiral to grow until a side would be 200 or more.
#    They write this while loop:
t.penup()
t.home()
t.pendown()
size = 10
while size < 200:
    t.forward(size)
    t.left(90)
    size = size + 10
print("size is now", size)
#    In your own words, what does this while loop do? Why does it stop?
#    Write your answer as comments below.


# 4. A student writes this while loop:
#        size = 10
#        while size < 200:
#            t.forward(size)
#            t.left(90)
#    What is wrong with this code? What will happen when it runs?
#    (Hint: look at whether size ever changes.)
#    Don't paste it in here as it is: it never ends. Write your answer as comments below.
`,
        tasks: [
          {
            pts: 15, text: 'Write a <code>for</code> loop using <code>range(1, 11)</code> that draws a spiral: each turn, <code>t.forward(size)</code>, then <code>t.left(90)</code>, then <code>size = size + 10</code>.',
            hint: 'All three lines go inside the block, indented 4 spaces. Step through <em>Grow with for</em> in the picture and watch each side come out 10 longer than the last.',
            cell: { draw: x => lengths(x.segs, SPIRAL(10)) ? true : x.segs.length !== 10 ? `That draws ${x.segs.length} line${x.segs.length === 1 ? '' : 's'}; range(1, 11) gives 10 turns.` : x.segs.every(s => near(s.len, 10)) ? 'Every line is 10 long: size never grows. Is size = size + 10 inside the loop?' : 'The sides should be 10, 20, 30 … 100, each turn 90° left.', label: '# t and size are already set. Type the for loop:', ph: 'for turn in range(…):\n    t.forward(size)\n    t.left(90)\n    size = …', must: [RANGE_TYPED(1, 11), 'Right spiral, but the task asks you to use range(1, 11).'], traps: [NO_INDENT, [/range\s*\(\s*1\s*,\s*10\s*\)/, 'range(1, 10) stops at 9 turns. The second number is not included.']], anchor: '#    t.forward(size), then t.left(90), then size = size + 10.' },
            check: c => lengths(c.segs, SPIRAL(10)) && byLoop(c, l => l.kind === 'for' && RANGE(1, 11).test(l.iter || '')),
          },
          {
            pts: 10, text: 'In your own words, what does <code>size = size + 10</code> do each turn? Answer in a comment line.',
            hint: 'Type <code>size = size + 10</code> at the <code>&gt;&gt;&gt;</code> prompt a few times, then <code>size</code>. Where does the new number come from, and where does it go?',
            cell: { why: true, re: /add|plus|bigger|longer|grow|increas|more|new|updat|chang|\+|10/, label: '# What does that line do each turn?', ph: 'It takes the size, …', whyHint: 'Say what gets added, and where the answer is stored.', anchor: '#    do each turn? Write your answer as comments below.' },
            check: c => { const n = c.notes(2); return n.length >= 15 && /add|plus|bigger|longer|grow|increas|more|new|updat|chang|\+|10/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: 'A student wants the spiral to grow until a side would be 200 or more. They write this <code>while</code> loop:<pre>size = 10\nwhile size &lt; 200:\n    t.forward(size)\n    t.left(90)\n    size = size + 10\nprint("size is now", size)</pre>In your own words, what does this while loop do? Why does it stop?',
            hint: 'Step through <em>Until 200 (while)</em> in the picture. Before every turn Python checks <code>size &lt; 200</code>. What is size when that becomes False?',
            cell: { why: true, tryCode: 'size = 10\nwhile size < 200:\n    t.forward(size)\n    t.left(90)\n    size = size + 10\nprint("size is now", size)', re: /200|stop|false|until|reach|bigger|more than|over|enough/, label: '# What does the while loop do, and why does it stop?', ph: 'It keeps … until …', whyHint: 'Say what happens on each turn, and what becomes False in the end.', anchor: '#    In your own words, what does this while loop do? Why does it stop?' },
            check: c => { const n = c.notes(3); return n.length >= 15 && /200|stop|false|until|reach|bigger|more than|over|enough/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 15, text: 'A student writes this <code>while</code> loop:<pre>size = 10\nwhile size &lt; 200:\n    t.forward(size)\n    t.left(90)</pre>What is wrong with this code? What will happen when it runs? (Hint: look at whether <code>size</code> ever changes.)',
            hint: 'Pick <em>Try: size never changes</em> in the picture and press Play. The turtle walks the same little square for ever; Python stops it after 20000 steps. Compare with <em>Fixed: size + 10</em>.',
            cell: { why: true, tryCode: 'size = 10\nwhile size < 200:\n    t.forward(size)\n    t.left(90)', re: /never|forever|infinite|endless|always|not (change|stop|grow)|doesn'?t (change|stop|grow)|stays|same|stuck|keeps|no end|on and on/, label: '# What is wrong, and what happens?', ph: 'size is always … so …', whyHint: 'Say what size is on every turn, and what that means for the check and for the loop.', anchor: '#    Don\'t paste it in here as it is: it never ends. Write your answer as comments below.' },
            check: c => { const n = c.notes(4); return n.length >= 15 && /never|forever|infinite|endless|always|not (change|stop|grow)|doesn'?t (change|stop|grow)|stays|same|stuck|keeps|no end|on and on/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
      {
        id: 'q3', title: 'Flower of Squares', bonus: true, var: 't', init: () => null,
        setup: PEN,
        turtle: {
          programs: [
            { label: 'Six squares, turning 60', code: 'for i in range(6):\n    for j in range(4):\n        t.forward(80)\n        t.left(90)\n    t.left(60)' },
            { label: 'Three triangles', code: 'for i in range(3):\n    for j in range(3):\n        t.forward(100)\n        t.left(120)\n    t.left(120)' },
          ],
        },
        starter: `import turtle
t = turtle.Pen()

# 1. Write a two-level loop (a loop inside a loop): the outer loop takes 6 turns
#    and turns t.left(60) at the end of each; the inner loop draws a square with
#    sides of 80 (4 turns of t.forward(80), t.left(90)).


# 2. How many lines does your program draw in total? Explain how you know.
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 5, text: 'Write a two-level loop (a loop inside a loop): the outer loop takes 6 turns and does <code>t.left(60)</code> at the end of each; inside it, a loop draws a square with sides of 80.',
            hint: 'The inner <code>for</code> is indented inside the outer one, and its two turtle lines are indented again. Step through <em>Six squares, turning 60</em> in the picture: on every outer turn the inner loop draws a whole square, then the turtle turns 60° and starts the next.',
            cell: { draw: x => x.segs.length === 24 && x.segs.every(s => near(s.len, 80)) && x.turns.filter(t => near(Math.abs(t.deg), 60, 0.5)).length === 6 ? true : x.segs.length === 4 ? 'That is one square. The outer loop should draw it 6 times, turning 60° between squares.' : x.segs.length !== 24 ? `That draws ${x.segs.length} lines. Six squares make 24.` : 'Each square needs sides of 80 and 90° corners, with a 60° turn between squares.', label: '# t is already a turtle. Type the loop inside a loop:', ph: 'for … in range(6):\n    for … in range(4):\n        t.forward(80)\n        t.left(90)\n    t.left(60)', must: [/\bfor\b[\s\S]*\bfor\b/, 'Right drawing, but the task asks for a loop inside a loop: two for lines.'], traps: [NO_INDENT], anchor: '#    sides of 80 (4 turns of t.forward(80), t.left(90)).' },
            check: c => c.segs.length === 24 && c.segs.every(s => near(s.len, 80)) && byLoop(c, l => l.kind === 'for' && l.depth >= 2),
          },
          {
            pts: 5, text: 'How many lines does your program draw in total? Explain how you know.',
            hint: 'Count the steps in the picture: how many outer turns, and how many sides on each one?',
            cell: { why: true, ok: s => /\b24\b|twenty[- ]four/i.test(s), label: '# How many lines, and how do you know?', ph: 'It draws … lines because …', rows: 2, okMsg: '✓ that is the number. Your teacher grades the how.', whyHint: 'Say the number, and how the six outer turns and four inner turns give it.', anchor: '#    Write your answer as comments below.' },
            check: c => { const n = c.notes(2); return n.length >= 10 && /\b24\b|twenty[- ]four/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
    ],
  };
})();
