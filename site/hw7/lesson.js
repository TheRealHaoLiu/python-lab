/* Lesson content: Flow control (if / elif / else, and / or, None).
   Same shape as hw6/lesson.js, plus:
     flow   – the picture: a slider for one variable and if-programs to watch (see app.js buildFlow)
     ask    – homework.py calls input(); this is the starting answer in the box next to Run
     probe  – {var, values}: grading tries every top-level if statement with each value
   New cell kind:
     {prog: v => text}  student types the task's code; it runs once for every probe value
                        and must print exactly prog(v) ('' = nothing)
        label    the comment above the box: what to type
        start    code the box starts with; from: k = start from task k's box when empty
        values   test values instead of the probe's
        anchor   the starter line in homework.py that "Add to homework.py" puts the code under
        traps: [[regex, message]]  extra help when what they typed matches a common slip
   New grading helpers:
     c.ifs     – each if statement: {line, outs[i] = lines printed for probe value i (null = error), ops, elifs, else}
     c.notes(n) – the student's own comments under starter heading "# n."
   A task's check sees only the if statements under its own heading (under: [n, …] to widen that)
     c.ran     – the script has no syntax error
*/
(function () {
  const has = (c, re) => re.test(c.code);
  const norm = s => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  // what one if statement printed for probe value i, as one line ('' = nothing, null = error)
  const said = (b, i) => b.outs[i] ? norm(b.outs[i].join(' ')) : null;
  // some if statement prints `text` exactly for the values where want(v) is true
  const printsWhen = (c, vals, text, want, extra = () => true) => c.ifs.some(b => extra(b) && vals.every((v, i) => {
    const s = said(b, i); return s !== null && s.includes(norm(text)) === want(v);
  }));

  const H = [0, 90, 100, 110, 119, 120, 121, 130, 150, 199, 200, 201, 210, 250];
  const RIDE = 'You can ride!', SHORT = 'Sorry, you are too short.';
  const A = [0, 5, 9, 10, 11, 12, 13, 14, 20, 99];
  const JOKES = {
    10: 'What do you call an unhappy cranberry? A blueberry!',
    11: 'What did the green grape say to the blue grape? Breathe! Breathe!',
    12: 'What did 0 say to 8? Hi guys!',
  };
  const HEADACHE = 'What is 13 + 49 + 84 + 155 + 97? A headache!';
  const SECRETS = [null, 'pizza', 'hi'], NOSECRET = 'No secret word yet!';
  const KID = a => a >= 10 && a <= 12;
  const PH_KID = 'if …:\n    print("What is 13 + 49 + 84 + 155 + 97? A headache!")';
  const BARE_OR = [/\bor\s+\d/, 'Each side of or must be a whole comparison: or age == 11, not or 11. On its own, 11 counts as True, so the condition is always true.'];
  const BARE_AND = [/\band\s*[<>=!]/, 'Each side of and needs its own variable: and height <= 200, not and <= 200.'];

  window.LESSON = {
    id: 'hw7',
    title: 'Homework 7: Flow Control',
    questions: [
      {
        id: 'q1', title: 'Roller Coaster Height Check', var: 'height', setup: 'height = 130', init: () => 130,
        ask: '130', probe: { var: 'height', values: H },
        flow: {
          var: 'height', min: 90, max: 220, step: 1, start: 130, unit: 'cm', tick: 10, tester: 'height > 150',
          programs: [
            { label: 'Kiddie coaster', code: 'if height < 140:\n    print("Hop on the kiddie coaster!")\nelse:\n    print("Too tall for this one. Try the big coaster!")' },
            { label: 'Bumper cars', code: 'if height >= 100 and height <= 180:\n    print("Grab a bumper car!")\nelse:\n    print("Not this time.")' },
          ],
        },
        starter: `height = int(input("How tall are you in cm? "))

# 1. Write an if statement that prints "You can ride!" if height is
#    greater than or equal to 120.
# 2. Then add an else: block to it, so that a rider shorter than 120 cm
#    sees "Sorry, you are too short."
#    Write the if and its else together, below this line.


# 3. A student writes this code:
#        height = 130
#        if height >= 120:
#        print("You can ride!")
#    What is wrong with this code? What will happen when it runs?
#    Write your answer as comments below.


# 4. Rewrite the code from task 3 so it runs correctly.


# 5. The park adds a maximum height of 200 cm for safety. Write an if
#    statement that prints "You can ride!" only when the rider is between
#    120 cm and 200 cm (inclusive). Its condition must use and.
`,
        tasks: [
          {
            pts: 10, text: 'Write an <code>if</code> statement that prints <code>"You can ride!"</code> if <code>height</code> is greater than or equal to <code>120</code>.',
            hint: 'An <code>if</code> line ends with a colon, and the line under it is indented 4 spaces. Greater than or equal to is written <code>&gt;=</code>.',
            cell: { prog: h => h >= 120 ? RIDE : '', label: '# height is already set. Type the if statement:', ph: 'if …:\n    print("You can ride!")', anchor: '#    Write the if and its else together, below this line.' },
            under: [1, 2], check: c => printsWhen(c, H, RIDE, h => h >= 120),
          },
          {
            pts: 10, text: 'Now add an <code>else:</code> block so that if the rider is shorter than 120 cm, it prints <code>"Sorry, you are too short."</code>',
            hint: '<code>else:</code> lines up with its <code>if</code>, has no condition, and runs only when the <code>if</code> condition was False.',
            cell: { prog: h => h >= 120 ? RIDE : SHORT, from: 0, label: '# Your if statement from task 1, with an else: block added:', ph: 'if …:\n    print("You can ride!")\nelse:\n    …', anchor: '#    Write the if and its else together, below this line.' },
            under: [1, 2], check: c => c.ifs.some(b => b.else && H.every((h, i) => { const s = said(b, i); return s !== null && s.includes(norm(RIDE)) === (h >= 120) && s.includes(norm(SHORT)) === (h < 120); })),
          },
          {
            pts: 10, text: 'A student writes this code:<pre>height = 130\nif height &gt;= 120:\nprint("You can ride!")</pre>What is wrong with this code? What will happen when it runs? Answer in comments (lines starting with <code>#</code>).',
            hint: 'Run it below and read the name of the error. Then look at the line in front of <code>print</code>.',
            cell: { why: true, tryCode: 'height = 130\nif height >= 120:\nprint("You can ride!")', re: /indent|space|tab/, whyHint: 'Say what Python does (the error) and what is missing in front of print.', anchor: '#    Write your answer as comments below.' },
            check: c => /indent|space|tab/i.test(c.notes(3)), doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'Rewrite the code from task 3 so it runs correctly.',
            hint: 'Keep the same three lines. Only one of them needs to change.',
            cell: { prog: () => RIDE, values: [130], start: 'height = 130\nif height >= 120:\nprint("You can ride!")', label: '# The code from task 3. Fix it so it runs:', must: [/^\s*height\s*=\s*130\s*$/m, "Keep the student's height = 130 line."], anchor: '# 4. Rewrite the code from task 3 so it runs correctly.' },
            check: c => {
              if (!c.ran) return false;
              const at = c.code.split('\n').findIndex(l => /^\s*height\s*=\s*130\s*$/.test(l));
              return at >= 0 && c.ifs.some(b => b.line > at + 1 && H.every((h, i) => { const s = said(b, i); return s !== null && s.includes(norm(RIDE)) === (h >= 120); }));
            },
          },
          {
            pts: 15, text: 'The park adds a maximum height of 200 cm for safety. Write a condition using <code>and</code> that is true only when the rider is between 120 cm and 200 cm (inclusive), then print <code>"You can ride!"</code>.',
            hint: 'Inclusive means 120 and 200 can both ride. Each side of <code>and</code> is a whole comparison with <code>height</code> in it.',
            cell: { prog: h => h >= 120 && h <= 200 ? RIDE : '', label: '# height is already set. Type the if statement, using and:', ph: 'if … and …:\n    print("You can ride!")', must: [/\band\b/, 'That works, but the task asks you to use and.'], traps: [BARE_AND], anchor: '#    120 cm and 200 cm (inclusive). Its condition must use and.' },
            check: c => printsWhen(c, H, RIDE, h => h >= 120 && h <= 200, b => b.ops.includes('and')),
          },
        ],
      },
      {
        id: 'q2', title: 'Joke Machine', var: 'age', setup: 'age = 11', init: () => 11,
        ask: '11', probe: { var: 'age', values: A },
        flow: {
          var: 'age', min: 5, max: 16, step: 1, start: 11, tick: 1, tester: 'age == 13 or 14',
          programs: [
            { label: 'Snack robot', code: 'if age == 6:\n    print("Apple slices!")\nelif age == 7:\n    print("Cheese crackers!")\nelif age == 8:\n    print("Banana bread!")\nelse:\n    print("Pretzels for everyone!")' },
            { label: 'Teen zone with or', code: 'if age == 13 or age == 14 or age == 15:\n    print("Welcome to the teen zone!")\nelse:\n    print("Huh?")' },
            { label: 'Teen zone with and', code: 'if age >= 13 and age <= 15:\n    print("Welcome to the teen zone!")\nelse:\n    print("Huh?")' },
          ],
        },
        starter: `age = int(input("How old are you? "))

# 1. Write an if / elif / else chain:
#      age 10        -> print "What do you call an unhappy cranberry? A blueberry!"
#      age 11        -> print "What did the green grape say to the blue grape? Breathe! Breathe!"
#      age 12        -> print "What did 0 say to 8? Hi guys!"
#      any other age -> print "Huh?"


# 2. Kid zone, ages 10 to 12: write a condition using or that is true
#    for age 10, 11, or 12.
#    if ______________________:
#        print("What is 13 + 49 + 84 + 155 + 97? A headache!")


# 3. Write the same kid zone check using and instead of or.


# 4. Why does  age >= 10 and age <= 12  give the same result as
#    age == 10 or age == 11 or age == 12 ?
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 25, text: 'Write an <code>if</code> / <code>elif</code> / <code>else</code> chain. If age is <code>10</code>, print <code>"What do you call an unhappy cranberry? A blueberry!"</code>. If age is <code>11</code>, print <code>"What did the green grape say to the blue grape? Breathe! Breathe!"</code>. If age is <code>12</code>, print <code>"What did 0 say to 8? Hi guys!"</code>. Otherwise, print <code>"Huh?"</code>.',
            hint: 'Python checks the conditions from the top and runs only the first one that is True. <code>else</code> catches every age the others missed. Try the Snack robot in the picture.',
            cell: { prog: a => JOKES[a] || 'Huh?', label: '# age is already set. Type the whole if / elif / else chain:', ph: 'if …:\n    print("…")\nelif …:\n    print("…")\nelse:\n    print("Huh?")', must: [/\belif\b/, 'That works, but the task asks for an if / elif / else chain.'], anchor: '#      any other age -> print "Huh?"' },
            check: c => has(c, /\belif\b/) && c.ifs.some(b => b.elifs >= 2 && b.else && A.every((a, i) => said(b, i) === norm(JOKES[a] || 'Huh?'))),
          },
          {
            pts: 10, text: 'The robot also has a "kid zone" joke for ages 10 to 12. Write a condition using <code>or</code> that is true for age 10, 11, or 12, and print <code>"What is 13 + 49 + 84 + 155 + 97? A headache!"</code>.',
            hint: 'Each part of an <code>or</code> is a whole comparison, like <code>age == 10</code>. Type <code>age == 13 or 14</code> into the condition tester in the picture to see why.',
            cell: { prog: a => KID(a) ? HEADACHE : '', label: '# age is already set. Type the kid zone if statement, using or:', ph: PH_KID, must: [/\bor\b/, 'That works, but the task asks you to use or.'], traps: [BARE_OR], anchor: '#        print("What is 13 + 49 + 84 + 155 + 97? A headache!")' },
            check: c => printsWhen(c, A, HEADACHE, KID, b => b.ops.includes('or')),
          },
          {
            pts: 10, text: 'Now write the "kid zone" check using <code>and</code> instead of <code>or</code>.',
            hint: 'Think of a range: at least 10, and at most 12. Compare the two Teen zone programs in the picture.',
            cell: { prog: a => KID(a) ? HEADACHE : '', from: 1, label: '# The same kid zone check, using and instead of or:', ph: PH_KID, must: [/\band\b/, 'That works, but the task asks you to use and.'], traps: [[/\band\s*[<>=!]/, 'Each side of and needs its own variable: and age <= 12, not and <= 12.']], anchor: '# 3. Write the same kid zone check using and instead of or.' },
            check: c => printsWhen(c, A, HEADACHE, KID, b => b.ops.includes('and')),
          },
          {
            pts: 10, text: 'Explain in your own words why <code>age &gt;= 10 and age &lt;= 12</code> gives the same result as <code>age == 10 or age == 11 or age == 12</code>.',
            hint: 'Ages are whole numbers. Which whole numbers are at least 10 and at most 12?',
            cell: { why: true, re: /./, ph: 'They match because…', whyHint: 'Write a sentence or two: which ages make each one True?', anchor: '#    Write your answer as comments below.' },
            check: c => c.notes(4).length >= 15, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
      {
        id: 'q3', title: 'Secret Word', bonus: true, var: 'secret', vars: ['secret', 'answer'],
        setup: 'secret = None\nanswer = "10"', init: () => ({ secret: null, answer: '10' }),
        probe: { var: 'secret', values: SECRETS },
        starter: `secret = None

# 1. What does print(secret) display? Write your guess as a comment, then print it.


# 2. Write an if statement that prints "No secret word yet!" when secret is None.


# 3. A student writes:
#        answer = "10"
#        if answer == 10:
#            print("Ten!")
#        else:
#            print("Not ten.")
#    What does this program print, and why? Answer as comments below.
#    (Hint: "10" with quotes is a string, while 10 without quotes is an integer.)
`,
        tasks: [
          {
            pts: 3, text: 'What does <code>print(secret)</code> display? Guess first, then print it in homework.py to check.',
            cell: { why: true, ok: /^\W*none\W*$/i, tryCode: 'print(secret)', label: '# Your guess: what will it display?', ph: 'I think it shows…', rows: 1, okMsg: '✓ right! Now print it in homework.py.', whyHint: 'Not yet. Run it and look closely.', anchor: '# 1. What does print(secret) display? Write your guess as a comment, then print it.' },
            check: c => c.printed('None') && has(c, /print\s*\(\s*secret\s*\)/),
          },
          {
            pts: 4, text: 'Write an <code>if</code> statement that prints <code>"No secret word yet!"</code> when <code>secret</code> is <code>None</code>.',
            hint: 'Check for “no value” the way the lecture does: <code>if myval == None:</code>',
            cell: { prog: v => v === null ? NOSECRET : '', label: '# secret is already set. Type the if statement:', ph: 'if …:\n    print("No secret word yet!")', anchor: '# 2. Write an if statement that prints "No secret word yet!" when secret is None.' },
            check: c => c.ifs.some(b => SECRETS.every((v, i) => { const s = said(b, i); return s !== null && s.includes(norm(NOSECRET)) === (v === null); })),
          },
          {
            pts: 3, text: 'A student writes:<pre>answer = "10"\nif answer == 10:\n    print("Ten!")\nelse:\n    print("Not ten.")</pre>What does this program print, and why?',
            hint: '<code>"10"</code> with quotes is a <strong>string</strong>, while <code>10</code> without quotes is an <strong>integer</strong>. Try the type buttons in the picture.',
            cell: { why: true, ok: /not\s*ten[\s\S]*(str|quot|text|word)|(str|quot|text|word)[\s\S]*not\s*ten/i, tryCode: 'answer = "10"\nif answer == 10:\n    print("Ten!")\nelse:\n    print("Not ten.")', label: '# What does it print, and why?', ph: 'It prints … because …', rows: 2, okMsg: '✓ answered. Your teacher grades the why.', whyHint: 'Say what it prints, and why "10" and 10 are not equal.', anchor: '#    What does this program print, and why? Answer as comments below.' },
            check: c => { const n = c.notes(3); return /not\s*ten/i.test(n) && /str|quot|text|word|int|number/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
    ],
  };
})();
