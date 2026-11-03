/* The turtle playground: four tabs on one page (Overview, Demo, Playground, Reference), one
   Python runtime. Questions: q1 gallery + q2 two turtles (Demo), q3 your own turtle
   (Playground), q4 the reference examples (Reference: one program per method, listed by
   play/tabs.js from window.TURTLE_REF). Lesson format: turtle/t6/lesson.js. */
(function () {
  const near = (a, b, tol = 1.5) => Math.abs(a - b) <= tol;
  const chain = segs => segs.every((s, i) => !i || (near(s.x1, segs[i - 1].x2, 1) && near(s.y1, segs[i - 1].y2, 1)));
  const closed = segs => segs.length > 2 && near(segs[segs.length - 1].x2, segs[0].x1, 2) && near(segs[segs.length - 1].y2, segs[0].y1, 2);
  const polygon = (segs, n, len) => segs.length === n && chain(segs) && closed(segs) && segs.every(s => near(s.len, len));
  const PEN = 'import turtle\nt = turtle.Pen()';

  /* ---------- the reference: every method the page's turtle supports ----------
     Each entry: sig (as typed), desc (one sentence), code (runs with t already made). */
  const REF = [
    { group: 'Moving', items: [
      { sig: 't.forward(distance)', alias: 't.fd()', desc: 'Walk forward that many steps in the direction the turtle faces, drawing a line if the pen is down.', code: 't.forward(150)' },
      { sig: 't.backward(distance)', alias: 't.back(), t.bk()', desc: 'Walk backwards without turning round.', code: 't.forward(60)\nt.backward(160)' },
      { sig: 't.left(angle)', alias: 't.lt()', desc: 'Turn left on the spot by that many degrees. 90 is a square corner, 360 a full turn.', code: 'for i in range(4):\n    t.forward(100)\n    t.left(90)' },
      { sig: 't.right(angle)', alias: 't.rt()', desc: 'Turn right on the spot by that many degrees.', code: 'for i in range(5):\n    t.forward(150)\n    t.right(144)' },
      { sig: 't.goto(x, y)', alias: 't.setpos(), t.setposition()', desc: 'Jump straight to a point. The middle of the screen is (0, 0); x goes right, y goes up.', code: 't.goto(100, 80)\nt.goto(-100, 80)\nt.goto(0, -60)\nt.goto(0, 0)' },
      { sig: 't.setx(x)', desc: 'Move sideways to a new x, keeping y.', code: 't.setx(120)\nt.setx(-120)' },
      { sig: 't.sety(y)', desc: 'Move up or down to a new y, keeping x.', code: 't.sety(90)\nt.sety(-90)' },
      { sig: 't.setheading(angle)', alias: 't.seth()', desc: 'Face a direction: 0 is right, 90 is up, 180 is left, 270 is down.', code: 'for angle in [0, 90, 180, 270]:\n    t.setheading(angle)\n    t.forward(80)\n    t.backward(80)' },
      { sig: 't.home()', desc: 'Go back to (0, 0) and face right.', code: 't.goto(120, 90)\nt.left(45)\nt.home()' },
      { sig: 't.circle(radius)', desc: 'Draw a circle of that radius, curving to the left of the turtle. A negative radius curves right.', code: 't.circle(60)\nt.circle(-60)' },
      { sig: 't.circle(radius, extent)', desc: 'Only part of a circle: extent is how many degrees of it to draw.', code: 't.circle(80, 180)\nt.left(90)\nt.circle(80, 90)' },
      { sig: 't.circle(radius, 360, steps)', desc: 'A circle drawn with that many straight sides: a polygon.', code: 't.circle(80, 360, 3)\nt.circle(80, 360, 6)' },
    ] },
    { group: 'The pen', items: [
      { sig: 't.penup()', alias: 't.pu(), t.up()', desc: 'Lift the pen: the turtle moves without drawing.', code: 't.forward(60)\nt.penup()\nt.forward(60)\nt.pendown()\nt.forward(60)' },
      { sig: 't.pendown()', alias: 't.pd(), t.down()', desc: 'Put the pen back on the paper.', code: 't.penup()\nt.goto(-100, 50)\nt.pendown()\nt.forward(200)' },
      { sig: 't.pensize(width)', alias: 't.width()', desc: 'How thick the line is, in pixels.', code: 'for w in [1, 3, 6, 10]:\n    t.pensize(w)\n    t.forward(50)' },
      { sig: 't.pencolor(color)', desc: 'The line colour: a name like "red", or "#ff8800" for a mixed colour.', code: 't.pencolor("red")\nt.forward(80)\nt.pencolor("#1f8a5b")\nt.forward(80)' },
      { sig: 't.fillcolor(color)', desc: 'The colour used inside a filled shape (see begin_fill).', code: 't.fillcolor("gold")\nt.begin_fill()\nt.circle(60)\nt.end_fill()' },
      { sig: 't.color(pen, fill)', desc: 'Set both colours at once; with one colour, both get it.', code: 't.color("navy", "skyblue")\nt.begin_fill()\nfor i in range(4):\n    t.forward(100)\n    t.left(90)\nt.end_fill()' },
      { sig: 't.begin_fill() … t.end_fill()', desc: 'Everything drawn between the two is filled with the fill colour when end_fill runs.', code: 't.color("black", "orange")\nt.begin_fill()\nfor i in range(5):\n    t.forward(140)\n    t.right(144)\nt.end_fill()' },
      { sig: 't.clear()', desc: 'Wipe this turtle\'s drawing; the turtle stays where it is.', code: 't.circle(60)\nt.clear()\nt.forward(100)' },
      { sig: 't.reset()', desc: 'Wipe the drawing and put the turtle back at (0, 0) facing right, with the pen settings back to normal.', code: 't.color("red")\nt.goto(100, 100)\nt.reset()\nt.forward(100)' },
    ] },
    { group: 'How the turtle looks', items: [
      { sig: 't.shape(name)', desc: 'Change the turtle\'s picture: "turtle", "arrow", "circle", "square", "triangle" or "classic".', code: 'for name in ["arrow", "circle", "square", "triangle", "classic", "turtle"]:\n    t.shape(name)\n    t.forward(40)' },
      { sig: 't.shapesize(width, length)', alias: 't.turtlesize()', desc: 'Make the turtle bigger or smaller (1 is normal).', code: 't.shape("turtle")\nt.shapesize(3, 3)\nt.forward(80)\nt.shapesize(1, 1)' },
      { sig: 't.hideturtle()', alias: 't.ht()', desc: 'Hide the turtle itself; the drawing stays.', code: 't.circle(50)\nt.hideturtle()' },
      { sig: 't.showturtle()', alias: 't.st()', desc: 'Show it again.', code: 't.hideturtle()\nt.forward(80)\nt.showturtle()' },
      { sig: 't.speed(n)', desc: 'In IDLE this sets the animation speed (0 is fastest). On this page the slow / quick / instant buttons do that instead, so speed() is accepted and ignored.', code: 't.speed(0)\nfor i in range(36):\n    t.forward(10)\n    t.left(10)' },
      { sig: 't.write(text, align, font)', desc: 'Write text where the turtle is. align is "left", "center" or "right"; font is (name, size, style).', code: 't.penup()\nt.goto(0, 40)\nt.write("Hello!", align="center", font=("Arial", 32, "bold"))\nt.goto(0, -40)\nt.write("small and plain")' },
    ] },
    { group: 'Asking the turtle', items: [
      { sig: 't.position()', alias: 't.pos()', desc: 'Where the turtle is, as (x, y).', code: 't.forward(100)\nt.left(90)\nt.forward(50)\nprint(t.position())' },
      { sig: 't.xcor() / t.ycor()', desc: 'Just the x, or just the y.', code: 't.goto(70, -30)\nprint("x is", t.xcor())\nprint("y is", t.ycor())' },
      { sig: 't.heading()', desc: 'Which way the turtle faces, in degrees.', code: 't.left(30)\nprint(t.heading())\nt.right(90)\nprint(t.heading())' },
      { sig: 't.distance(x, y)', desc: 'How far it is from the turtle to that point.', code: 't.goto(30, 40)\nprint(t.distance(0, 0))' },
      { sig: 't.towards(x, y)', desc: 'The heading that would point the turtle at that point.', code: 'angle = t.towards(100, 100)\nprint(angle)\nt.setheading(angle)\nt.forward(141)' },
      { sig: 't.isdown()', desc: 'True when the pen is down.', code: 'print(t.isdown())\nt.penup()\nprint(t.isdown())' },
      { sig: 't.isvisible()', desc: 'True when the turtle is shown.', code: 'print(t.isvisible())\nt.hideturtle()\nprint(t.isvisible())' },
    ] },
    { group: 'The screen and more turtles', items: [
      { sig: 'turtle.Pen() / turtle.Turtle()', desc: 'Make a turtle. Make two and they share the screen, each with its own pen and position.', code: 'u = turtle.Turtle()\nu.color("red")\nt.left(90)\nfor i in range(4):\n    t.forward(80)\n    t.left(90)\n    u.forward(80)\n    u.right(90)' },
      { sig: 't.clone()', desc: 'A copy of this turtle: same place, colour and heading.', code: 't.color("purple")\nt.forward(50)\nu = t.clone()\nu.left(90)\nu.forward(80)\nt.forward(80)' },
      { sig: 'turtle.bgcolor(color)', desc: 'Paint the whole background.', code: 'turtle.bgcolor("lightyellow")\nt.color("darkgreen")\nt.circle(70)' },
      { sig: 'turtle.done() / turtle.mainloop()', desc: 'In IDLE these keep the window open at the end of a script. Here they do nothing, so scripts written for IDLE run as they are.', code: 't.forward(100)\nturtle.done()' },
    ] },
  ];
  window.TURTLE_REF = REF;
  window.TURTLE_UNSUPPORTED = [
    ['t.dot(), t.stamp()', 'accepted, but nothing appears on this page'],
    ['turtle.colormode(255) and (r, g, b) tuples', 'use colour names or "#rrggbb" strings instead'],
    ['t.onclick(), turtle.onkey(), turtle.ontimer()', 'no mouse or keyboard events on this page'],
    ['turtle.tracer(), turtle.update(), turtle.setup(), turtle.screensize(), turtle.title()', 'print a warning and do nothing'],
    ['turtle.exitonclick()', 'prints a warning; leave it out, or keep it for IDLE and ignore the line'],
  ];

  window.LESSON = {
    id: 'turtle-play',
    title: 'Turtle Playground',
    turtle: true,
    turtleFiles: { 'turtlegames.py': 'turtle/play/turtlegames.py' },  // import turtlegames works on this page
    questions: [
      {
        id: 'q1', title: 'Gallery', var: 't', init: () => null,
        setup: PEN,
        turtle: {
          programs: [
            { label: 'Square', code: 'for i in range(4):\n    t.forward(120)\n    t.left(90)' },
            { label: 'Star', code: 't.color("goldenrod")\nt.width(3)\nfor i in range(5):\n    t.forward(220)\n    t.right(144)' },
            { label: 'Spiral', code: 'size = 5\nwhile size < 230:\n    t.forward(size)\n    t.left(91)\n    size = size + 5' },
            { label: 'Flower', code: 'colors = ["red", "orange", "gold", "green", "blue", "purple"]\nfor c in colors:\n    t.color(c)\n    for j in range(4):\n        t.forward(90)\n        t.left(90)\n    t.left(60)' },
            { label: 'Polygons 3 to 8', code: 't.penup()\nt.goto(-60, -80)\nt.pendown()\nfor sides in range(3, 9):\n    for j in range(sides):\n        t.forward(60)\n        t.left(360 / sides)' },
            { label: 'Filled star', code: 't.color("navy", "gold")\nt.begin_fill()\nfor i in range(5):\n    t.forward(200)\n    t.right(144)\nt.end_fill()' },
            { label: 'Circles', code: 'for i in range(12):\n    t.circle(70)\n    t.left(30)' },
            { label: 'Rainbow fan', code: 'colors = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"]\nt.width(4)\nfor i in range(14):\n    t.color(colors[i % 7])\n    t.forward(150)\n    t.backward(150)\n    t.left(360 / 14)' },
            { label: 'Random walk', code: 'import random\nfor i in range(60):\n    t.color(random.choice(["red", "green", "blue", "purple"]))\n    t.forward(random.randint(10, 40))\n    t.left(random.choice([90, -90]))' },
            { label: 'Say hello', code: 't.penup()\nt.goto(-120, 60)\nt.pendown()\nt.color("teal")\nt.write("Hello, turtle!", font=("Arial", 28, "bold"))\nt.goto(-120, 40)\nt.forward(230)' },
            { label: 'Try: a typo', code: 't.forward(100)\nt.lefft(90)\nt.forward(100)' },
            { label: 'Try: never ends', code: 'while True:\n    t.forward(20)\n    t.left(170)' },
          ],
        },
        starter: `import turtle
t = turtle.Pen()

# Press Run to draw this, then change the numbers and run it again.
# Step runs one line at a time. Replay plays the drawing again.
colors = ["red", "orange", "gold", "green", "blue", "purple"]
t.width(2)
for c in colors:
    t.color(c)
    for j in range(5):
        t.forward(100)
        t.right(144)
    t.left(60)
t.hideturtle()
print("done:", len(colors), "stars")
`,
        tasks: [
          {
            pts: 1, text: 'Example check: draw a triangle with sides of 100 (three lines, three turns of 120).',
            hint: 'Three <code>t.forward(100)</code> and three <code>t.left(120)</code>, or a <code>for</code> loop with <code>range(3)</code>.',
            cell: { draw: x => polygon(x.segs, 3, 100) ? true : x.segs.length !== 3 ? `That draws ${x.segs.length} line${x.segs.length === 1 ? '' : 's'}. A triangle needs 3.` : !closed(x.segs) ? 'The turtle should end where it started: the turn for a triangle is 120.' : 'Each side should be 100 long.', label: '# Type code and press Check; the little picture shows what it drew:', ph: 'for i in range(3):\n    t.forward(100)\n    t.left(120)', anchor: '# Press Run to draw this, then change the numbers and run it again.' },
            check: c => polygon(c.segs, 3, 100),
          },
          {
            pts: 1, text: 'Example question: what does <code>t.left(360)</code> do? Answer in a sentence.',
            hint: 'Try it at the prompt and watch the turtle.',
            cell: { why: true, tryCode: 't.left(360)', re: /full|round|circle|same|nothing|back|where it (was|started)|all the way|spin|360/, label: '# What does t.left(360) do?', ph: 'It turns …', whyHint: 'Say where the turtle faces afterwards.', anchor: '# Step runs one line at a time. Replay plays the drawing again.' },
            check: c => /full|round|circle|same|nothing|back|where it (was|started)|all the way|spin|360/i.test(c.notes(2)), doneLabel: 'answered',
          },
        ],
      },
      {
        id: 'q2', title: 'Two Turtles', var: 'a', vars: ['a', 'b'], init: () => ({ a: null, b: null }),
        setup: 'import turtle\na = turtle.Pen()\nb = turtle.Pen()\na.color("red")\nb.color("blue")\na.penup(); a.goto(-200, 60); a.pendown()\nb.penup(); b.goto(-200, -60); b.pendown()',
        turtle: {
          programs: [
            { label: 'Race', code: 'import random\nfor lap in range(12):\n    a.forward(random.randint(10, 40))\n    b.forward(random.randint(10, 40))\nprint("a is at", round(a.xcor()))\nprint("b is at", round(b.xcor()))' },
            { label: 'Mirror squares', code: 'for i in range(4):\n    a.forward(100)\n    a.left(90)\n    b.forward(100)\n    b.right(90)' },
            { label: 'Shapes side by side', code: 'a.shape("turtle")\nb.shape("circle")\nfor i in range(36):\n    a.forward(8)\n    a.left(10)\n    b.forward(12)\n    b.right(10)' },
          ],
        },
        tasks: [],
      },
      {
        id: 'q3', file: 'my_turtle.py', title: 'Your turtle', var: 't', init: () => null,
        setup: PEN,
        turtle: { programs: [] },
        starter: `import turtle
t = turtle.Pen()

# Your turtle. Some ideas:
#   a house: a square with a triangle on top
#   your initials, with t.penup() between the letters
#   a spiral that changes colour every turn
t.color("steelblue")
t.width(3)
for i in range(8):
    t.forward(120)
    t.left(135)
`,
        tasks: [],
      },
      /* ---------- games (play/turtlegames.py) ---------- */
      {
        id: 'g1', title: 'Maze Runner', var: 't', init: () => null,
        setup: 'from turtlegames import *\nt = maze(1)',
        turtle: { programs: [] },
        drive: { ArrowUp: 't.forward(20)', ArrowDown: 't.backward(20)', ArrowLeft: 't.left(15)', ArrowRight: 't.right(15)' },
        tasks: [],
      },
      {
        id: 'g2', title: 'Treasure Hunt', var: 't', init: () => null,
        setup: 'from turtlegames import *\nt = treasure()',
        turtle: { programs: [] },
        drive: { ArrowUp: 't.forward(20)', ArrowDown: 't.backward(20)', ArrowLeft: 't.left(15)', ArrowRight: 't.right(15)' },
        tasks: [],
      },
      {
        id: 'g3', title: 'Cannon', var: 't', init: () => null,
        setup: 'from turtlegames import *\nt = cannon()',
        turtle: { programs: [] },
        drive: { ArrowLeft: 't.left(5)', ArrowRight: 't.right(5)', ArrowUp: 't.fire()', ' ': 't.fire()' },
        tasks: [],
      },
      {
        id: 'g4', title: 'Turtle Race', var: 'winner', init: () => null,
        setup: 'from turtlegames import *',
        turtle: { programs: [
          { label: 'Race!', code: 'race()' },
          { label: 'Bet on blue', code: 'race("blue")' },
          { label: 'Five races', code: 'wins = {}\nfor i in range(5):\n    race()\n    w = last_winner()\n    wins[w] = wins.get(w, 0) + 1\nprint(wins)' },
        ] },
        tasks: [],
      },
      {
        id: 'g5', file: 'golf.py', title: 'Turtle Golf', var: 'ball', init: () => null,
        setup: 'from turtlegames import *\nball = golf(1)',
        turtle: { programs: [] },
        starter: `from turtlegames import *

# Hole 1 is a straight shot. Try golf(2) and golf(3): water in the way!
# Every ball.forward() and every turn is one stroke. Fewest strokes wins.
ball = golf(1)
ball.forward(440)
`,
        tasks: [],
      },
      {
        id: 'g6', file: 'art.py', title: 'Art Machine', var: 'seed', init: () => null,
        setup: 'from turtlegames import *',
        turtle: { programs: [
          { label: 'Surprise me', code: 'art()' },
          { label: 'Art #7', code: 'art(7)' },
          { label: 'Art #2024', code: 'art(2024)' },
        ] },
        starter: `from turtlegames import *
import turtle

# Press Run for a random picture; art(7) always gives picture number 7.
art()

# Or make your own: change sides, size, turn and the colours.
t = turtle.Pen()
t.hideturtle()
sides = 5
size = 90
turn = 12
colors = ["crimson", "darkorange", "gold", "seagreen", "royalblue", "purple"]
for i in range(360 // turn):
    t.color(colors[i % len(colors)])
    for j in range(sides):
        t.forward(size)
        t.left(360 / sides)
    t.left(turn)
`,
        tasks: [],
      },
      {
        id: 'q4', title: 'Reference', var: 't', init: () => null,
        setup: PEN,
        turtle: { programs: REF.flatMap(g => g.items).map(r => ({ label: r.sig, code: r.code })) },
        tasks: [],
      },
    ],
  };
})();
