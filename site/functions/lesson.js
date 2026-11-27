/* Lesson content: Homework 10, functions and modules.
   Built from the teacher's posting (Q1 function basics, Q2 functions with loops and modules, bonus
   on default arguments). The function machines show look-alike functions, so they don't give the
   answers away. Picture: fn – {functions: [{code, args}]} (app.js buildFn). */
(function () {
  const has = (c, re) => re.test(c.code);
  const DEF = (name, params) => new RegExp(`^\\s*def\\s+${name}\\s*\\(\\s*${params}\\s*\\)\\s*:`, 'm');
  const CALL = (name, args) => new RegExp(`(^|[^\\w.])${name}\\s*\\(\\s*${args}\\s*\\)`, 'm');
  // a call outside the def line itself (def fib(n): would otherwise count as calling fib(n))
  const calls = (c, re) => re.test(c.code.split('\n').filter(l => !/^\s*def\s/.test(l)).join('\n'));
  const count = (c, re) => (c.code.match(re) || []).length;
  // the def block of one function (its def line and the indented lines under it), so one function's
  // loop or return can't pass another function's task
  const body = (c, name) => {
    const lines = c.code.split('\n'), i = lines.findIndex(l => new RegExp(`^def\\s+${name}\\s*\\(`).test(l));
    if (i < 0) return '';
    const out = [lines[i]];
    for (const l of lines.slice(i + 1)) { if (l.trim() && !/^\s/.test(l)) break; out.push(l); }
    return out.join('\n');
  };
  const inDef = (c, name, re) => re.test(body(c, name));
  // the first n Fibonacci numbers as Python prints the list (n >= 2, like the posting's aList = [0, 1])
  const FIBS = n => { const a = [0, 1]; while (a.length < n) a.push(a[a.length - 1] + a[a.length - 2]); return '[' + a.join(', ') + ']'; };
  const FIB7 = FIBS(7);
  const SAVINGS = 'def savings(pocket_money, paper_route, spending):\n    return pocket_money + paper_route - spending';
  const WAVE = "def wave(name):\n    print('Hi %s, welcome aboard!' % name)";
  const TRIANGLE = 'def triangle_area(base, height):\n    return base * height / 2';
  const SNACKS = 'def snack_total():\n    apples = 3\n    bananas = 4\n    return apples + bananas';
  const DOUBLES = 'def doubles(n):\n    aList = [1]\n    while len(aList) < n:\n        aList.append(aList[-1] * 2)\n    return aList';
  const SQUARES = 'def squares(n):\n    aList = []\n    for i in range(1, n + 1):\n        aList.append(i * i)\n    return aList';
  const ORDER = "def order(food, drinks=1):\n    print('Order: %s, drinks: %s' % (food, drinks))";
  const TIP = 'def tip(bill, percent=15):\n    return bill * percent / 100';
  const MYSTERY = 'def mystery(x, y=2):\n    return x * y\n\nprint(mystery(5))\nprint(mystery(5, 3))\nprint(mystery(y=4, x=2))';
  const WHY = 'answered (teacher grades this one)';
  const IMPORT_RE = /module|toolbox|tool|library|function|bring|load|borrow|use|access/i;
  const LOCAL_RE = /inside|within|in (a|the) function|only|local/i;
  const DEFAULT_RE = /default|already|given|set|=\s*2/i;

  window.LESSON = {
    id: 'hw10',
    title: 'Homework 10: Functions and Modules',
    questions: [
      {
        id: 'q1', title: 'Function Basics', var: 'who', vars: ['who'],
        setup: `who = 'Owen'\n\n${WAVE}\n\n${SAVINGS}\n\n${TRIANGLE}\n\n${SNACKS}`,
        init: () => 'Owen', probe: { var: 'who', values: ['Mary', 'Owen'] },
        cellSetup: "who = 'Owen'",  // the practice boxes must define the functions themselves
        fn: {
          functions: [
            { code: WAVE, args: ["'Mary'"] },
            { code: SAVINGS, args: ['10', '10', '5'] },
            { code: TRIANGLE, args: ['6', '4'] },
            { code: SNACKS, args: [] },
          ],
        },
        starter: `who = "Owen"

# Part A: Writing Functions

# 1. Write a function called greet that takes one parameter name and prints
#    "Hello, [name]!". Call it once to see it work, for example greet(who).


# 2. Write a function called circle_area that takes one parameter r and returns
#    the area of a circle using math.pi * r * r. Don't forget to import math first.


# Part B: Parameters and Return Values

# 3. Write a function called rectangle_area that takes parameters a and b and
#    returns a * b.


# 4. Use your rectangle_area function to compute and print the area of a
#    rectangle with sides 12 and 90.


# 5. What is the difference between a function that prints a value and a
#    function that returns a value? Give one example of each from this
#    homework. Write your answer as comments below.


# Part C: Scope

# 6. Look at this code:
#        def variable_test():
#            first_variable = 10
#            second_variable = 20
#            return first_variable * second_variable
#
#        print(variable_test())
#        print(first_variable)
#    What does this program print? What happens on the last line, and why?
#    Write your answer as comments below.


# 7. In your own words, what is a local variable? Write your answer as
#    comments below.
`,
        tasks: [
          {
            pts: 10, text: 'Write a function called <code>greet</code> that takes one parameter <code>name</code> and prints <code>"Hello, [name]!"</code>.',
            hint: 'A function is a recipe with a name. <code>def greet(name):</code> writes the recipe; the indented block is what it does; <code>greet("Mary")</code> runs it. Nothing happens until you call it. Try <code>wave()</code> in the picture: same shape, different words.',
            cell: { prog: v => `Hello, ${v}!`, label: '# who is already set. Type the def, then one call: greet(who)', ph: 'def greet(name):\n    print(…)\ngreet(who)', must: [/\bdef\s+greet\s*\(/, 'That prints the right thing, but write it as a function called greet.'], anchor: '#    "Hello, [name]!". Call it once to see it work, for example greet(who).' },
            check: c => has(c, DEF('greet', 'name')) && calls(c, CALL('greet', '[^)\\n]+')) && c.outputs.some(l => /^Hello, .+!$/.test(l)),
          },
          {
            pts: 10, text: 'Write a function called <code>circle_area</code> that takes one parameter <code>r</code> and <em>returns</em> the area of a circle using <code>math.pi * r * r</code>. Don\'t forget to <code>import math</code> first.',
            hint: '<code>import math</code> goes at the top, once. Inside the function, <code>return</code> hands the area back. Compare <code>triangle_area()</code> in the picture: it returns, it doesn\'t print.',
            cell: { prog: () => '12.566370614359172', values: ['Owen'], label: '# Type import math, the def, then print(circle_area(2)) to test it:', ph: 'import math\n\ndef circle_area(r):\n    return …\nprint(circle_area(2))', must: [/\breturn\b[^\n]*math\s*\.\s*pi/, 'Right number, but the function must return math.pi * r * r.'], traps: [[/^(?![\s\S]*import\s+math)/, 'Python only knows math after import math.']], anchor: "#    the area of a circle using math.pi * r * r. Don't forget to import math first." },
            check: c => has(c, /^\s*import\s+math\b/m) && has(c, DEF('circle_area', 'r')) && inDef(c, 'circle_area', /\breturn\b[^\n]*math\s*\.\s*pi/),
          },
          {
            pts: 5, text: 'Write a function called <code>rectangle_area</code> that takes parameters <code>a</code> and <code>b</code> and returns <code>a * b</code>.',
            hint: 'Two parameters, one <code>return</code> line.',
            cell: { prog: () => '12', values: ['Owen'], label: '# Type the def, then print(rectangle_area(3, 4)) to test it:', ph: 'def rectangle_area(a, b):\n    return …\nprint(rectangle_area(3, 4))', must: [/\breturn\b/, 'Right number, but the function must return the area.'], anchor: '#    returns a * b.' },
            check: c => has(c, DEF('rectangle_area', 'a\\s*,\\s*b')) && inDef(c, 'rectangle_area', /return\s+(a\s*\*\s*b|b\s*\*\s*a)\b/),
          },
          {
            pts: 5, text: 'Use your <code>rectangle_area</code> function to compute and print the area of a rectangle with sides 12 and 90.',
            hint: 'The function returns the area, so wrap the call in <code>print( )</code>.',
            check: c => calls(c, CALL('rectangle_area', '12\\s*,\\s*90')) && c.printed('1080'),
          },
          {
            pts: 5, text: 'What is the difference between a function that <em>prints</em> a value and a function that <em>returns</em> a value? Give one example of each from this homework.',
            hint: 'Press <code>print(wave(\'Mary\'))</code> in the picture. <code>wave</code> prints, but what does the call hand back? Then look at <code>savings</code>. Which of your functions works like each one?',
            cell: { why: true, rows: 4, ok: s => s.length >= 15 && /print/i.test(s) && /return/i.test(s), label: '# Prints vs returns, with one example of each:', ph: 'A function that prints … A function that returns … For example, greet …', whyHint: 'Say what each kind does, and name one function from this homework for each.', anchor: '#    homework. Write your answer as comments below.' },
            check: c => { const n = c.notes(5); return n.length >= 15 && /print/i.test(n) && /return/i.test(n); }, doneLabel: WHY,
          },
          {
            pts: 10, text: 'Look at this code:<pre>def variable_test():\n    first_variable = 10\n    second_variable = 20\n    return first_variable * second_variable\n\nprint(variable_test())\nprint(first_variable)</pre>What does this program print? What happens on the last line, and why?',
            hint: 'Write your guess, then run it. Try <code>snack_total()</code> in the picture and press <code>Try: print(apples)</code>. Where does <code>apples</code> live?',
            cell: { why: true, rows: 4, tryCode: 'def variable_test():\n    first_variable = 10\n    second_variable = 20\n    return first_variable * second_variable\n\nprint(variable_test())\nprint(first_variable)', ok: s => s.length >= 15 && /200/.test(s) && /nameerror|not defined|error/i.test(s), label: '# What prints, what happens on the last line, and why?', ph: 'It prints … Then the last line gives … because first_variable …', whyHint: 'Say what the first print shows, name the error on the last line, and say where first_variable exists.', anchor: '#    Write your answer as comments below.' },
            check: c => { const n = c.notes(6); return n.length >= 15 && /200/.test(n) && /nameerror|not defined|error/i.test(n); }, doneLabel: WHY,
          },
          {
            pts: 5, text: 'In your own words, what is a <strong>local variable</strong>?',
            hint: 'Think of <code>first_variable</code> and <code>apples</code>: where were they made, and when can you use them?',
            cell: { why: true, ok: s => s.length >= 15 && LOCAL_RE.test(s), label: '# What is a local variable?', ph: 'A local variable is …', whyHint: 'Say where a local variable is made and where you can use it.', anchor: '#    comments below.' },
            check: c => { const n = c.notes(7); return n.length >= 15 && LOCAL_RE.test(n); }, doneLabel: WHY,
          },
        ],
      },
      {
        id: 'q2', title: 'Functions with Loops and Modules', var: 'n', vars: ['n'],
        setup: `import math\nn = 7\n\n${DOUBLES}\n\n${SQUARES}\n\n${ORDER}`,
        init: () => 7, probe: { var: 'n', values: [7, 10] },
        cellSetup: 'n = 7',
        fn: {
          functions: [
            { code: DOUBLES, args: ['6'] },
            { code: SQUARES, args: ['5'] },
            { code: ORDER, args: ["'pizza'", '3'] },
          ],
        },
        starter: `n = 7

# Part A: Fibonacci Functions

# 1. Write a function called fib that takes parameter n and returns a list of
#    the first n Fibonacci numbers. Start with aList = [0, 1], then use a while
#    loop to append the next number (the sum of the last two) until the list
#    has n items.


# 2. Write a function called fib2 that does the same thing but uses a for loop
#    instead of a while loop. Start with aList = [0, 1], and if n < 2 just
#    return aList.


# 3. Call both functions with n = 7 and print the results. Do they return the
#    same list? Write your answer as a comment below.


# Part B: Default Arguments

# 4. Write a function called ask_ok that takes a prompt and a default
#    retries=4. The body can be simple: for example, just print the prompt and
#    the number of retries. Call it twice: once with only the prompt, and once
#    with retries=1.


# Part C: Modules

# 5. Using import math, write one line that prints the value of math.pi, and
#    one line that prints the square root of 144 (math.sqrt(144)).


# 6. In your own words, what does import math do, and why is it useful?
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 15, text: 'Write a function called <code>fib</code> that takes parameter <code>n</code> and returns a list of the first <code>n</code> Fibonacci numbers. Start with <code>aList = [0, 1]</code>, then use a <code>while</code> loop to append the next number (the sum of the last two) until the list has <code>n</code> items.',
            hint: 'The last two items are <code>aList[-1]</code> and <code>aList[-2]</code>. <code>len(aList)</code> says how many items there are so far. <code>doubles()</code> in the picture grows a list with a while loop the same way, but it doubles instead of adding.',
            cell: { prog: v => FIBS(v), label: '# n is already set. Type the def, then: print(fib(n))', ph: 'def fib(n):\n    aList = [0, 1]\n    while …:\n        …\n    return aList\nprint(fib(n))', must: [/\bwhile\b/, 'Right list, but this one must use a while loop.'], anchor: '#    has n items.' },
            check: c => has(c, DEF('fib', 'n')) && ['aList\\s*=\\s*\\[\\s*0\\s*,\\s*1\\s*\\]', '\\bwhile\\b', '\\.append\\s*\\(', '\\breturn\\b'].every(re => inDef(c, 'fib', new RegExp(re))),
          },
          {
            pts: 10, text: 'Write a function called <code>fib2</code> that does the same thing but uses a <code>for</code> loop instead of a <code>while</code> loop. Start with <code>aList = [0, 1]</code>, and if <code>n &lt; 2</code> just return <code>aList</code>.',
            hint: 'The list already has 2 items, so the loop needs to add <code>n - 2</code> more: <code>range(2, n)</code>. <code>squares()</code> in the picture builds a list with a for loop.',
            cell: { prog: v => FIBS(v), label: '# n is already set. Type the def, then: print(fib2(n))', ph: 'def fib2(n):\n    aList = [0, 1]\n    if n < 2:\n        return aList\n    for i in range(…):\n        …\n    return aList\nprint(fib2(n))', must: [/\bfor\b/, 'Right list, but this one must use a for loop.'], traps: [[/\bwhile\b/, 'fib2 is the for-loop version: no while here.']], anchor: '#    return aList.' },
            check: c => has(c, DEF('fib2', 'n')) && ['aList\\s*=\\s*\\[\\s*0\\s*,\\s*1\\s*\\]', '\\bfor\\b', 'if\\s+n\\s*<\\s*2\\s*:', '\\.append\\s*\\(', '\\breturn\\b'].every(re => inDef(c, 'fib2', new RegExp(re))) && !inDef(c, 'fib2', /\bwhile\b/),
          },
          {
            pts: 5, text: 'Call both functions with <code>n = 7</code> and print the results. Do they return the same list?',
            hint: `Two print lines. Both should show <code>${FIB7}</code>. For the question, write a comment, or print <code>fib(7) == fib2(7)</code>.`,
            check: c => calls(c, CALL('fib', '(7|n)')) && calls(c, CALL('fib2', '(7|n)')) && c.outputs.filter(l => l === FIB7).length >= 2 && (/yes|same|equal/i.test(c.notes(3)) || c.printed('True')),
          },
          {
            pts: 10, text: 'Write a function called <code>ask_ok</code> that takes a <code>prompt</code> and a default <code>retries=4</code>. The body can be simple: for example, just print the prompt and the number of retries. Call it twice: once with only the prompt, and once with <code>retries=1</code>.',
            hint: 'A default goes in the def line: <code>def ask_ok(prompt, retries=4):</code>. Press <code>order(\'pizza\')</code> and <code>order(\'pizza\', drinks=3)</code> in the picture to see a default at work.',
            cell: { prog: () => null, values: [7], outOk: lines => lines.length < 2 ? 'Call it twice, so it prints at least two lines.' : !lines.some(l => /\b4\b/.test(l)) ? 'The call with only the prompt should show retries as 4.' : !lines.some(l => /\b1\b/.test(l)) ? 'The second call should show retries as 1.' : true, label: '# Type the def with retries=4, then the two calls:', ph: "def ask_ok(prompt, retries=4):\n    print(…)\nask_ok('Do you really want to quit?')\nask_ok('Do you really want to quit?', retries=1)", must: [/\bdef\s+ask_ok\s*\(\s*\w+\s*,\s*retries\s*=\s*4\s*\)/, 'It prints, but the def line must give retries a default of 4.'], okMsg: '✓ two calls, one default', anchor: '#    with retries=1.' },
            check: c => has(c, DEF('ask_ok', '\\w+\\s*,\\s*retries\\s*=\\s*4')) && count(c, /^\s*ask_ok\s*\(/gm) >= 2 && has(c, /^\s*ask_ok\s*\([^)\n]*retries\s*=\s*1\s*\)/m) && has(c, /^\s*ask_ok\s*\([^,)\n]+\)/m),
          },
          {
            pts: 5, text: 'Using <code>import math</code>, write one line that prints the value of <code>math.pi</code>, and one line that prints the square root of 144 (<code>math.sqrt(144)</code>).',
            hint: 'Press <code>math.sqrt(81)</code> in the picture. The dot means “the sqrt tool from the math toolbox”.',
            cell: { prog: () => ['3.141592653589793', '12.0'], values: [7], label: '# Type import math, then the two print lines:', ph: 'import math\nprint(…)\nprint(…)', must: [/math\s*\.\s*sqrt\s*\(\s*144\s*\)/, 'Right numbers, but use math.sqrt(144) for the square root.'], anchor: '#    one line that prints the square root of 144 (math.sqrt(144)).' },
            check: c => has(c, /^\s*import\s+math\b/m) && has(c, /print\s*\(\s*math\s*\.\s*pi\s*\)/) && has(c, /math\s*\.\s*sqrt\s*\(\s*144\s*\)/) && c.printed('3.141592653589793') && c.printed('12.0'),
          },
          {
            pts: 5, text: 'In your own words, what does <code>import math</code> do, and why is it useful?',
            hint: 'Think of a toolbox someone else packed. What does the line bring in, and what can you do after it that you couldn\'t before? Press <code>Try: sqrt(81)</code> in the picture.',
            cell: { why: true, ok: s => s.length >= 15 && IMPORT_RE.test(s), label: '# What does import math do, and why is it useful?', ph: 'import math … so that …', whyHint: 'Say what import math brings in and what that lets your script do.', anchor: '#    Write your answer as comments below.' },
            check: c => { const n = c.notes(6); return n.length >= 15 && IMPORT_RE.test(n); }, doneLabel: WHY,
          },
        ],
      },
      {
        id: 'q3', title: 'Bonus Challenge', bonus: true, var: 'bill', vars: ['bill'],
        setup: `bill = 40\n\n${TIP}`,
        init: () => 40, cellSetup: 'bill = 40',
        fn: { functions: [{ code: TIP, args: ['40', '20'] }] },
        starter: `# A student writes this function:
#     def mystery(x, y=2):
#         return x * y
#     print(mystery(5))
#     print(mystery(5, 3))
#     print(mystery(y=4, x=2))

# 1. What does each print display? List all three outputs in order.
#    Write your answer as comments below.


# 2. Explain why mystery(5) works even though the function has two
#    parameters. What is y equal to in that call? Write your answer as
#    comments below.
`,
        tasks: [
          {
            pts: 5, text: `A student writes this function:<pre>${MYSTERY}</pre>What does each print display? List all three outputs in order.`,
            hint: 'Work out each call before you run it. When a value is missing, Python uses the default from the def line. Named arguments (<code>y=4, x=2</code>) can come in any order.',
            cell: { why: true, rows: 2, tryCode: MYSTERY, ok: s => /\b10\b\D+\b15\b\D+\b8\b/.test(s), label: '# Your guess first: the three outputs, in order', ph: '…, …, …', okMsg: '✓ that\'s it. Run it below to see.', whyHint: 'Not quite. Work out x * y for each call, using y = 2 when y is missing. Then run it below to check.', anchor: '#    Write your answer as comments below.' },
            check: c => /\b10\b\D+\b15\b\D+\b8\b/.test(c.notes(1)) || c.outputs.join(' ').includes('10 15 8'),
          },
          {
            pts: 5, text: 'Explain why <code>mystery(5)</code> works even though the function has two parameters. What is <code>y</code> equal to in that call?',
            hint: 'Press <code>tip(40)</code> in the picture. Which value did <code>percent</code> get, and where did it come from?',
            cell: { why: true, ok: s => s.length >= 15 && /\b2\b|two/i.test(s) && DEFAULT_RE.test(s), label: '# Why does mystery(5) work, and what is y?', ph: 'It works because … so y is …', whyHint: 'Say what y is in that call and where Python got that value.', anchor: '#    comments below.' },
            check: c => { const n = c.notes(2); return n.length >= 15 && /\b2\b|two/i.test(n) && DEFAULT_RE.test(n); }, doneLabel: WHY,
          },
        ],
      },
    ],
  };
})();
