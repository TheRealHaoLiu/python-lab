/* Lesson content: functions and modules (Homework 9, DRAFT).
   Written before the teacher posted HW9, from the book's chapter 7 (Python for Kids: savings,
   spaceship_building, variable scope, import time/random) in the shape of her other homeworks.
   Swap the stories and wording for the real posting when it lands; keep the checks.
   New picture: fn – {functions: [{code, args}]} (app.js buildFn). */
(function () {
  const has = (c, re) => re.test(c.code);
  const DEF = (name, params) => new RegExp(`^\\s*def\\s+${name}\\s*\\(\\s*${params}\\s*\\)\\s*:`, 'm');
  const CALL = (name, args) => new RegExp(`(^|[^\\w.])${name}\\s*\\(\\s*${args}\\s*\\)`, 'm');
  const WEEKS = (cans, n) => { const out = []; for (let w = 1; w <= n; w++) out.push(`Week ${w} = ${w * cans}`); return out; };
  const SAVINGS = "def savings(pocket_money, paper_route, spending):\n    return pocket_money + paper_route - spending";
  const SHIP = "def spaceship_building(cans):\n    total_cans = 0\n    for week in range(1, 53):\n        total_cans = total_cans + cans\n        print('Week %s = %s' % (week, total_cans))";

  window.LESSON = {
    id: 'hw9',
    title: 'Homework 9: Functions (draft)',
    questions: [
      {
        id: 'q1', title: "Robot Chef's Recipes", var: 'recipe', vars: ['recipe'], setup: `${SAVINGS}\n\ndef wave(name):\n    print('Hi %s, welcome aboard!' % name)\n\ndef triangle_area(base, height):\n    return base * height / 2`,
        init: () => ({}),
        cellSetup: '',  // the practice boxes must define the functions themselves
        fn: {
          functions: [
            { code: SAVINGS, args: ['10', '10', '5'] },
            { code: "def wave(name):\n    print('Hi %s, welcome aboard!' % name)", args: ["'Mary'"] },
            { code: 'def triangle_area(base, height):\n    return base * height / 2', args: ['6', '4'] },
          ],
        },
        starter: `# 1. Write a function greet(name) that prints "Hello, <name>!", then call it
#    twice with two different names.


# 2. Write the savings function from class, with return, and print savings(10, 10, 5):
#        def savings(pocket_money, paper_route, spending):
#            return pocket_money + paper_route - spending


# 3. A student writes:
#        def add(a, b):
#            total = a + b
#        print(add(2, 3))
#    What does it print? Why? Write your answer as comments below.


# 4. Rewrite the student's add function so that print(add(2, 3)) prints 5.


# 5. Write a function rectangle_area(length, width) that returns length times
#    width. Print rectangle_area(3, 4) and rectangle_area(10, 2).
`,
        tasks: [
          {
            pts: 10, text: 'Write a function <code>greet(name)</code> that prints <code>Hello, &lt;name&gt;!</code>, then call it twice with two different names.',
            hint: 'A function is a recipe with a name. <code>def greet(name):</code> writes the recipe; the indented block is what it does; <code>greet("Mary")</code> cooks it. Nothing happens until you call it. Try <code>wave()</code> in the picture.',
            cell: { prog: () => ['Hello, Mary!', 'Hello, Owen!'], values: [''], label: "# Type the def, then two calls: greet('Mary') and greet('Owen')", ph: "def greet(name):\n    print(…)\ngreet('Mary')\ngreet('Owen')", must: [/\bdef\s+greet\s*\(/, 'That prints the right thing, but write it as a function called greet.'], anchor: '#    twice with two different names.' },
            check: c => has(c, DEF('greet', '\\w+')) && (c.code.match(/^\s*greet\s*\(/gm) || []).length >= 2 && new Set(c.outputs.filter(l => /^Hello, .+!$/.test(l))).size >= 2,
          },
          {
            pts: 10, text: 'Write the <code>savings</code> function from class, with <code>return</code>, and print <code>savings(10, 10, 5)</code>.',
            hint: '<code>return</code> hands a value back to whoever called. Step the picture: <code>savings(10, 10, 5)</code> prints nothing by itself, it <em>returns</em> 15, so you print the call.',
            cell: { prog: () => '15', values: [''], label: '# Type the def with return, then print(savings(10, 10, 5)):', ph: 'def savings(pocket_money, paper_route, spending):\n    return …\nprint(savings(10, 10, 5))', must: [/\breturn\b/, 'Right number, but the function must return it.'], anchor: '#            return pocket_money + paper_route - spending' },
            check: c => has(c, DEF('savings', '\\w+\\s*,\\s*\\w+\\s*,\\s*\\w+')) && has(c, /\breturn\b/) && c.printed('15') && has(c, CALL('savings', '10\\s*,\\s*10\\s*,\\s*5')),
          },
          {
            pts: 10, text: 'A student writes:<pre>def add(a, b):\n    total = a + b\nprint(add(2, 3))</pre>What does it print? Why?',
            hint: 'Run it below. The function works out the total and then keeps it to itself. What does a function give back when it has no <code>return</code>?',
            cell: { why: true, tryCode: 'def add(a, b):\n    total = a + b\n\nprint(add(2, 3))', re: /none|return/i, label: '# What prints, and why?', ph: 'It prints … because …', whyHint: 'Name what prints, and say what is missing from the function.', anchor: '#    What does it print? Why? Write your answer as comments below.' },
            check: c => { const n = c.notes(3); return /none/i.test(n) && /return/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: "Rewrite the student's <code>add</code> function so that <code>print(add(2, 3))</code> prints <code>5</code>.",
            hint: 'One word fixes it.',
            cell: { prog: () => '5', values: [''], start: 'def add(a, b):\n    total = a + b\nprint(add(2, 3))', label: "# The student's code. Fix the function:", must: [/\breturn\b/, 'Right number, but fix the function rather than printing 5.'], anchor: '# 4. Rewrite the student\'s add function so that print(add(2, 3)) prints 5.' },
            check: c => has(c, DEF('add', '\\w+\\s*,\\s*\\w+')) && has(c, /return\s+(total|a\s*\+\s*b)/) && c.printed('5') && has(c, CALL('add', '2\\s*,\\s*3')),
          },
          {
            pts: 15, text: 'Write a function <code>rectangle_area(length, width)</code> that <em>returns</em> length times width. Print <code>rectangle_area(3, 4)</code> and <code>rectangle_area(10, 2)</code>.',
            hint: 'Two parameters, one <code>return</code>. Compare <code>triangle_area</code> in the picture: same shape, different maths.',
            cell: { prog: () => ['12', '20'], values: [''], label: '# Type the def, then the two prints:', ph: 'def rectangle_area(length, width):\n    return …\nprint(rectangle_area(3, 4))\nprint(rectangle_area(10, 2))', must: [/\breturn\b/, 'Right numbers, but the function must return the area.'], anchor: '#    width. Print rectangle_area(3, 4) and rectangle_area(10, 2).' },
            check: c => has(c, DEF('rectangle_area', '\\w+\\s*,\\s*\\w+')) && has(c, /\breturn\b/) && c.printed('12') && c.printed('20') && has(c, CALL('rectangle_area', '3\\s*,\\s*4')) && has(c, CALL('rectangle_area', '10\\s*,\\s*2')),
          },
        ],
      },
      {
        id: 'q2', title: 'Spaceship Cans', var: 'cans', vars: ['cans'], setup: `cans = 2\n\n${SHIP}\n\ndef pocket(weeks, allowance):\n    total = 0\n    for week in range(1, weeks + 1):\n        total = total + allowance\n    return total`,
        init: () => 2, probe: { var: 'cans', values: [2, 13] },
        cellSetup: 'cans = 2',
        fn: {
          functions: [
            { code: SHIP, args: ['2'] },
            { code: 'def pocket(weeks, allowance):\n    total = 0\n    for week in range(1, weeks + 1):\n        total = total + allowance\n    return total', args: ['4', '5'] },
          ],
        },
        starter: `cans = 2

# 1. Write the spaceship_building function from class and call it with 2 cans a week:
#        def spaceship_building(cans):
#            total_cans = 0
#            for week in range(1, 53):
#                total_cans = total_cans + cans
#                print('Week %s = %s' % (week, total_cans))


# 2. Call it again with 13 cans a week.


# 3. A student adds this line after the function, outside it:
#        print(total_cans)
#    What happens? Why? Write your answer as comments below.


# 4. Write a new version, spaceship_building(cans, weeks), where the number of
#    weeks is a parameter too. Call it with 2 cans for 5 weeks.


# 5. Write total_cans_after(cans, weeks) that returns the total instead of
#    printing every week. Print total_cans_after(2, 52).
`,
        tasks: [
          {
            pts: 15, text: 'Write the <code>spaceship_building(cans)</code> function from class and call it with 2 cans a week.',
            hint: 'The loop goes <em>inside</em> the function, indented under the def. Then one call line, not indented, makes it run. Press <code>spaceship_building()</code> in the picture.',
            cell: { prog: v => WEEKS(v, 52), label: '# cans is already set. Type the def, then one call: spaceship_building(cans)', ph: 'def spaceship_building(cans):\n    total_cans = 0\n    for week in range(1, 53):\n        …\nspaceship_building(cans)', must: [/\bdef\s+spaceship_building\s*\(/, 'Right lines, but write it as the function spaceship_building.'], anchor: "#                print('Week %s = %s' % (week, total_cans))" },
            check: c => has(c, DEF('spaceship_building', '\\w+')) && has(c, /range\s*\(\s*1\s*,\s*53\s*\)/) && has(c, CALL('spaceship_building', '2')) && c.printed('Week 1 = 2') && c.printed('Week 52 = 104'),
          },
          {
            pts: 5, text: 'Call it again with 13 cans a week.',
            hint: 'Same recipe, different ingredient: one more call line.',
            check: c => has(c, CALL('spaceship_building', '13')) && c.printed('Week 52 = 676'),
          },
          {
            pts: 10, text: 'A student adds <code>print(total_cans)</code> after the function, outside it. What happens? Why?',
            hint: 'Run it below. <code>total_cans</code> is made inside the function and lives only while the function runs. Try <code>print(total_cans)</code> at the picture’s <code>&gt;&gt;&gt;</code> prompt after a call.',
            cell: { why: true, tryCode: 'def spaceship_building(cans):\n    total_cans = 0\n    for week in range(1, 53):\n        total_cans = total_cans + cans\n\nspaceship_building(2)\nprint(total_cans)', re: /nameerror|inside|local|scope|outside|not defined|only in|disappear|gone/i, label: '# What happens, and why?', ph: 'Python gives a … because total_cans …', whyHint: 'Name the error, and say where total_cans exists and where it does not.', anchor: '#    What happens? Why? Write your answer as comments below.' },
            check: c => { const n = c.notes(3); return n.length >= 15 && /nameerror|not defined|error/i.test(n) && /inside|local|scope|outside|only|function/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: 'Write a new version, <code>spaceship_building(cans, weeks)</code>, where the number of weeks is a parameter too. Call it with 2 cans for 5 weeks.',
            hint: 'The loop needs <code>range(1, weeks + 1)</code> so that <code>weeks</code> is the last week printed. Compare <code>pocket()</code> in the picture.',
            cell: { prog: v => WEEKS(v, 5), label: '# cans is already set. Type the two-parameter def, then: spaceship_building(cans, 5)', ph: 'def spaceship_building(cans, weeks):\n    …\nspaceship_building(cans, 5)', must: [/\bweeks\b/, 'Right lines, but the number of weeks must be a parameter called weeks.'], anchor: '#    weeks is a parameter too. Call it with 2 cans for 5 weeks.' },
            check: c => has(c, DEF('spaceship_building', '\\w+\\s*,\\s*weeks')) && has(c, /range\s*\(\s*1\s*,\s*weeks\s*\+\s*1\s*\)/) && has(c, CALL('spaceship_building', '2\\s*,\\s*5')) && c.printed('Week 5 = 10'),
          },
          {
            pts: 10, text: 'Write <code>total_cans_after(cans, weeks)</code> that <em>returns</em> the total instead of printing every week. Print <code>total_cans_after(2, 52)</code>.',
            hint: 'Same loop, but no print inside: after the loop, <code>return total_cans</code>. Then print the call. <code>pocket()</code> in the picture is this shape.',
            cell: { prog: v => String(v * 52), label: '# cans is already set. Type the def, then: print(total_cans_after(cans, 52))', ph: 'def total_cans_after(cans, weeks):\n    …\n    return …\nprint(total_cans_after(cans, 52))', must: [/\breturn\b/, 'Right number, but the function must return it.'], anchor: '#    printing every week. Print total_cans_after(2, 52).' },
            check: c => has(c, DEF('total_cans_after', '\\w+\\s*,\\s*\\w+')) && has(c, /\breturn\b/) && has(c, CALL('total_cans_after', '2\\s*,\\s*52')) && c.printed('104'),
          },
        ],
      },
      {
        id: 'q3', title: 'Borrowing Tools: Modules', bonus: true, var: 'sides', vars: ['sides'], setup: 'import random\nimport time\nsides = 6\n\ndef roll_dice(sides):\n    return random.randint(1, sides)',
        init: () => 6, cellSetup: 'import random\nimport time\nsides = 6',
        fn: { functions: [{ code: 'def roll_dice(sides):\n    return random.randint(1, sides)', args: ['6'] }] },
        starter: `# 1. Import the time module and print the date and time with time.asctime()


# 2. Import the random module. Write a function roll() that returns
#    random.randint(1, 6), and print roll() three times.


# 3. In your own words: what does import do? Write your answer as comments below.
`,
        tasks: [
          {
            pts: 3, text: 'Import the <code>time</code> module and print the date and time with <code>time.asctime()</code>.',
            hint: 'Two lines: <code>import time</code>, then <code>print(time.asctime())</code>. The dot means “the asctime tool from the time toolbox”.',
            check: c => has(c, /^\s*import\s+time\b/m) && has(c, /time\s*\.\s*asctime\s*\(\s*\)/) && c.outputs.some(l => /^\w{3} \w{3} +\d+ \d\d:\d\d:\d\d \d{4}$/.test(l)),
          },
          {
            pts: 4, text: 'Import the <code>random</code> module. Write a function <code>roll()</code> that returns <code>random.randint(1, 6)</code>, and print <code>roll()</code> three times.',
            hint: 'Press <code>roll_dice()</code> in the picture a few times: a different number each time. <code>roll()</code> takes no parameters, so its parentheses stay empty.',
            check: c => has(c, /^\s*import\s+random\b/m) && has(c, DEF('roll', '')) && has(c, /random\s*\.\s*randint\s*\(\s*1\s*,\s*6\s*\)/) && (c.code.match(/print\s*\(\s*roll\s*\(\s*\)\s*\)/g) || []).length >= 3 && c.outputs.filter(l => /^[1-6]$/.test(l)).length >= 3,
          },
          {
            pts: 3, text: 'In your own words: what does <code>import</code> do?',
            hint: 'Think of a toolbox someone else packed. What does the line fetch, and what can you do after it?',
            cell: { why: true, re: /module|toolbox|tool|library|code|function|use|bring|load|borrow|get/i, label: '# What does import do?', ph: 'import … so that …', whyHint: 'Say what import brings in and what that lets your script do.' },
            check: c => { const n = c.notes(3); return n.length >= 15 && /module|toolbox|tool|library|code|function|use|bring|load|borrow|get/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
    ],
  };
})();
