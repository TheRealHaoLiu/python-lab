/* Lesson content: loops (for, range(), while, a loop inside a loop).
   Same shape as hw7/lesson.js, plus:
     loop   – the picture: programs to step through one turn at a time (see app.js buildLoop)
              {programs: [{label, code}], watch: [variables shown after each turn], tester, limit}
     probe  – {var, values}: prog cells run the student's loop once per value, so a loop that
              really walks the list passes and six print lines typed by hand don't
   A prog cell's prog(v) may return a list of lines: the code must print exactly those, in order.
   New grading helper:
     c.loops – each top-level for/while as the script ran it: {line, kind, out, iter, target, test, depth}
               (only the ones under the task's own starter heading, like c.ifs)
*/
(function () {
  const norm = s => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const same = (got, want) => got.length === want.length && got.every((l, i) => norm(l) === norm(want[i]));
  // some loop under this task's heading printed exactly these lines
  const loopPrints = (c, want, extra = () => true) => c.loops.some(l => extra(l) && same(l.out, want));
  const RANGE = (a, b) => new RegExp(`^range\\(\\s*${a}\\s*,\\s*${b}\\s*\\)$`);
  const RANGE_TYPED = (a, b) => new RegExp(`range\\s*\\(\\s*${a}\\s*,\\s*${b}\\s*\\)`);
  const nums = (a, b) => { const o = []; for (let k = a; k < b; k++) o.push(String(k)); return o; };

  const WIZ = ['spider legs', 'toe of frog', 'snail tongue', 'bat wing', 'slug butter', 'bear burp'];
  // the second test list has the SAME length as the first, so loops by index (range(0, 6),
  // range(len(...))) stay correct; only hand-typed names fail
  const WIZ2 = ['newt eye', 'owl feather', 'moon dust', 'troll sweat', 'ghost pepper', 'frog breath'];
  // "What does range(1, 10) produce?": 1 to 9 listed in order, and not 10 (the words "range(1, 10)" don't count)
  const RANGE9 = text => {
    const t = text.replace(/range\s*\(\s*1\s*,\s*10\s*\)/gi, ' ');
    const s = (t.match(/\d+/g) || []).join(',');
    return (s.includes('1,2,3,4,5,6,7,8,9') && !s.includes('1,2,3,4,5,6,7,8,9,10')) || /\b1\s*(to|-|–|through|up to|till|until)\s*9\b/i.test(t);
  };

  const COINS = m => { const out = []; let c = 20; for (let w = 1; w <= 52; w++) { c += m - 3; out.push(`Week ${w} = ${c}`); } return out; };
  const PAIRS = L => L.flatMap(a => L.map(b => `${a} ${b}`));
  const HHP = ['huge', 'hairy', 'pants'], HHP2 = ['red', 'green', 'blue'];  // same length, see WIZ2
  const NO_INDENT = [/^for[^\n]*:\s*\n(?!\s)/m, 'The line under for must be indented 4 spaces.'];

  window.LESSON = {
    id: 'hw8',
    title: 'Homework 8: Loops',
    questions: [
      {
        id: 'q1', title: "Wizard's Potion Assembly Line", var: 'wizard_list',
        setup: `wizard_list = [${WIZ.map(JSON.stringify).join(', ')}]`, init: () => ({ t: 'list', items: WIZ }),
        probe: { var: 'wizard_list', values: [WIZ, WIZ2] },
        loop: {
          watch: ['ingredient', 'i'], tester: 'range(1, 10)',
          programs: [
            { label: 'Each ingredient', code: 'for ingredient in wizard_list:\n    print(ingredient)' },
            { label: 'First three, by number', code: 'for i in range(0, 3):\n    print(wizard_list[i])' },
            { label: 'Count with range', code: 'for n in range(4, 9):\n    print(n)\nprint("Done!")' },
            { label: 'Try: no indent', code: 'for i in range(1, 4):\nprint(i)' },
          ],
        },
        starter: `wizard_list = [${WIZ.map(JSON.stringify).join(', ')}]

# 1. Write a for loop that prints each ingredient in wizard_list, one per line.


# 2. Write a for loop using range(1, 6) that prints the numbers 1 through 5.


# 3. What does range(1, 10) produce? List the numbers as a comment below.


# 4. A student writes this code:
#        for i in range(1, 4):
#        print(i)
#    What is wrong with this code? What will happen when it runs?
#    Write your answer as comments below.


# 5. Rewrite the code from task 4 so it runs correctly.


# 6. A student wants to print the first three ingredients from wizard_list.
#    He writes:
#        for i in range(0, 3):
#            print(wizard_list[i])
#    What will this print? Explain why wizard_list[i] works inside the loop.
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 10, text: 'Write a <code>for</code> loop that prints each ingredient in <code>wizard_list</code>, one per line.',
            hint: 'Pick a name for the loop variable, like <code>ingredient</code>. Each turn it holds the next item, so print it inside the block. Step through <em>Each ingredient</em> in the picture.',
            cell: { prog: L => L, label: '# wizard_list is already set. Type the for loop:', ph: 'for … in wizard_list:\n    print(…)', traps: [NO_INDENT], anchor: '# 1. Write a for loop that prints each ingredient in wizard_list, one per line.' },
            check: c => loopPrints(c, WIZ, l => l.kind === 'for'),
          },
          {
            pts: 10, text: 'Write a <code>for</code> loop using <code>range(1, 6)</code> that prints the numbers 1 through 5.',
            hint: 'The second number in <code>range()</code> is where it stops, and it is not included: see <em>Count with range</em> in the picture. Type <code>range(1, 6)</code> into the <code>for x in</code> box to see the turns.',
            cell: { prog: () => nums(1, 6), values: [WIZ], label: '# Type the for loop, using range(1, 6):', ph: 'for … in range(…):\n    print(…)', must: [RANGE_TYPED(1, 6), 'That prints the right numbers, but the task asks you to use range(1, 6).'], traps: [NO_INDENT], anchor: '# 2. Write a for loop using range(1, 6) that prints the numbers 1 through 5.' },
            check: c => loopPrints(c, nums(1, 6), l => l.kind === 'for' && RANGE(1, 6).test(l.iter || '')),
          },
          {
            pts: 10, text: 'What does <code>range(1, 10)</code> produce? List the numbers.',
            hint: 'The second number is where it stops, and it is not included. Count how many boxes the picture shows for it.',
            cell: { why: true, ok: RANGE9, tryCode: 'for i in range(1, 10): print(i)', label: '# Your guess: which numbers does range(1, 10) make?', ph: '1, 2, …', rows: 1, okMsg: '✓ right! Run the line to see them come out one per turn.', whyHint: 'List every number it makes, in order, and stop where range stops.', anchor: '# 3. What does range(1, 10) produce? List the numbers as a comment below.' },
            check: c => RANGE9(c.notes(3)), doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: 'A student writes this code:<pre>for i in range(1, 4):\nprint(i)</pre>What is wrong with this code? What will happen when it runs? Answer in comments (lines starting with <code>#</code>).',
            hint: 'Run it below and read the name of the error. Then look at the line in front of <code>print</code>.',
            cell: { why: true, tryCode: 'for i in range(1, 4):\nprint(i)', re: /indent|space|tab/, whyHint: 'Say what Python does (the error) and what is missing in front of print.', anchor: '#    Write your answer as comments below.' },
            check: c => /indent|space|tab/i.test(c.notes(4)), doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'Rewrite the code from task 4 so it runs correctly.',
            hint: 'Keep the same two lines. Only one of them needs to change.',
            cell: { prog: () => nums(1, 4), values: [WIZ], start: 'for i in range(1, 4):\nprint(i)', label: '# The code from task 4. Fix it so it runs:', must: [RANGE_TYPED(1, 4), "Keep the student's range(1, 4)."], anchor: '# 5. Rewrite the code from task 4 so it runs correctly.' },
            check: c => c.ran && loopPrints(c, nums(1, 4), l => l.kind === 'for' && RANGE(1, 4).test(l.iter || '')),
          },
          {
            pts: 5, text: 'A student wants to print the first three ingredients from <code>wizard_list</code>. He writes:<pre>for i in range(0, 3):\n    print(wizard_list[i])</pre>What will this print? Explain why <code>wizard_list[i]</code> works inside the loop.',
            hint: 'Step through <em>First three, by number</em> in the picture and watch which box lights up each turn. What is <code>i</code> each time, and what does <code>wizard_list[0]</code> mean?',
            cell: { why: true, tryCode: 'for i in range(0, 3):\n    print(wizard_list[i])', re: /index|position|number|spot|place|box|\b[012]\b/, label: '# What does it print, and why does wizard_list[i] work?', ph: 'It prints … because i is …', whyHint: 'Name the three things it prints, and say what i is on each turn and what wizard_list[i] picks.', anchor: '#    What will this print? Explain why wizard_list[i] works inside the loop.' },
            check: c => { const n = c.notes(6); return n.length >= 15 && /index|position|number|spot|place|box|\b[012]\b/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
      {
        id: 'q2', title: 'Magic Coin Counter', var: 'coins', vars: ['coins', 'found_coins', 'magic_coins', 'stolen_coins'],
        setup: 'found_coins = 20\nmagic_coins = 70\nstolen_coins = 3\ncoins = found_coins',
        init: () => ({ coins: 20, found_coins: 20, magic_coins: 70, stolen_coins: 3 }),
        probe: { var: 'magic_coins', values: [70, 5] },
        loop: {
          watch: ['week', 'coins', 'count'], tester: 'range(1, 53)',
          programs: [
            { label: 'First 5 weeks', code: "for week in range(1, 6):\n    coins = coins + magic_coins - stolen_coins\n    print('Week %s = %s' % (week, coins))" },
            { label: 'Until 1000', code: 'coins = found_coins\nweek = 0\nwhile coins < 1000:\n    coins = coins + magic_coins - stolen_coins\n    week = week + 1\nprint("Week", week, "coins =", coins)' },
            { label: 'Try: count never changes', code: 'count = 0\nwhile count < 3:\n    print("Hello!")' },
            { label: 'Fixed: count + 1', code: 'count = 0\nwhile count < 3:\n    print("Hello!")\n    count = count + 1' },
          ],
        },
        starter: `found_coins = 20
magic_coins = 70
stolen_coins = 3
coins = found_coins

# 1. Write a for loop using range(1, 53) that, for each week, updates the
#    coin count and prints it. Use this pattern inside the loop:
#        coins = coins + magic_coins - stolen_coins
#        print('Week %s = %s' % (week, coins))


# 2. In your own words: what does
#        coins = coins + magic_coins - stolen_coins
#    do each week? Write your answer as comments below.


# 3. A student wants to know when the wizard will have more than 1000 coins.
#    They write this while loop:
coins = found_coins
week = 0
while coins < 1000:
    coins = coins + magic_coins - stolen_coins
    week = week + 1
print("Week", week, "coins =", coins)
#    In your own words, what does this while loop do? Why does it stop?
#    Write your answer as comments below.


# 4. A student writes this while loop:
#        count = 0
#        while count < 3:
#            print("Hello!")
#    What is wrong with this code? What will happen when it runs?
#    (Hint: look at whether count ever changes.)
#    Don't paste it in here as it is: it never ends. Write your answer as comments below.
`,
        tasks: [
          {
            pts: 15, text: 'Write a <code>for</code> loop using <code>range(1, 53)</code> that, for each week, updates the coin count and prints it. Use this pattern inside the loop:<pre>coins = coins + magic_coins - stolen_coins\nprint(\'Week %s = %s\' % (week, coins))</pre>',
            hint: 'The loop variable is the week number, so call it <code>week</code>. Both lines of the pattern go inside the block, indented 4 spaces. Step through <em>First 5 weeks</em> in the picture and watch <code>coins</code> climb; your loop does the same for 52 weeks.',
            cell: { prog: COINS, label: '# found_coins, magic_coins, stolen_coins and coins are already set. Type the for loop:', ph: 'for week in range(…):\n    coins = …\n    print(…)', must: [RANGE_TYPED(1, 53), 'Right totals, but the task asks you to use range(1, 53).'], traps: [NO_INDENT, [/range\s*\(\s*1\s*,\s*52\s*\)/, 'range(1, 52) stops at week 51. The second number is not included.']], anchor: "#        print('Week %s = %s' % (week, coins))" },
            check: c => loopPrints(c, COINS(70), l => l.kind === 'for' && RANGE(1, 53).test(l.iter || '')),
          },
          {
            pts: 10, text: 'In your own words, what does <code>coins = coins + magic_coins - stolen_coins</code> do each week? Answer in a comment line.',
            hint: 'Press the <code>coins = coins + magic_coins - stolen_coins</code> button in the picture a few times. Where does the new number come from, and where does it go?',
            cell: { why: true, re: /add|plus|subtract|minus|take|new|updat|chang|gain|los|steal|stolen|more|less|\+|-/, label: '# What does that line do each week?', ph: 'It takes the coins the wizard has, …', whyHint: 'Say what gets added, what gets taken away, and where the answer is stored.', anchor: '#    do each week? Write your answer as comments below.' },
            check: c => { const n = c.notes(2); return n.length >= 15 && /add|plus|subtract|minus|take|new|updat|chang|gain|los|steal|stolen|more|less|\+|-/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: 'A student wants to know when the wizard will have more than 1000 coins. They write this <code>while</code> loop:<pre>coins = found_coins\nweek = 0\nwhile coins &lt; 1000:\n    coins = coins + magic_coins - stolen_coins\n    week = week + 1\nprint("Week", week, "coins =", coins)</pre>In your own words, what does this while loop do? Why does it stop?',
            hint: 'Step through <em>Until 1000</em> in the picture. Look at the chip on the <code>while</code> line on the last turn: what did the check say?',
            cell: { why: true, tryCode: 'coins = found_coins\nweek = 0\nwhile coins < 1000:\n    coins = coins + magic_coins - stolen_coins\n    week = week + 1\nprint("Week", week, "coins =", coins)', re: /1000|stop|false|until|reach|more than|over|enough/, label: '# What does the while loop do, and why does it stop?', ph: 'It keeps … until …', whyHint: 'Say what happens on each turn, and what becomes False in the end.', anchor: '#    In your own words, what does this while loop do? Why does it stop?' },
            check: c => { const n = c.notes(3); return n.length >= 15 && /1000|stop|false|until|reach|more than|over|enough/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 15, text: 'A student writes this <code>while</code> loop:<pre>count = 0\nwhile count &lt; 3:\n    print("Hello!")</pre>What is wrong with this code? What will happen when it runs? (Hint: look at whether <code>count</code> ever changes.)',
            hint: 'Pick <em>Try: count never changes</em> in the picture and press <em>Run to the end</em>. Then compare it with <em>Fixed: count + 1</em>. You can also run it below: Python stops it after 20000 steps.',
            cell: { why: true, tryCode: 'count = 0\nwhile count < 3:\n    print("Hello!")', re: /never|forever|infinite|endless|always|not (change|stop)|doesn'?t (change|stop)|stays|same|stuck|keeps|no end|on and on/, label: '# What is wrong, and what happens?', ph: 'count is always … so …', whyHint: 'Say what count is on every turn, and what that means for the check and for the loop.', anchor: '#    Don\'t paste it in here as it is: it never ends. Write your answer as comments below.' },
            check: c => { const n = c.notes(4); return n.length >= 15 && /never|forever|infinite|endless|always|not (change|stop)|doesn'?t (change|stop)|stays|same|stuck|keeps|no end|on and on/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
      {
        id: 'q3', title: 'Huge Hairy Pants', bonus: true, var: 'hugehairypants',
        setup: `hugehairypants = [${HHP.map(JSON.stringify).join(', ')}]`, init: () => ({ t: 'list', items: HHP }),
        probe: { var: 'hugehairypants', values: [HHP, HHP2] },
        loop: {
          watch: ['i', 'j', 'word', 'n'], tester: 'range(3)',
          programs: [
            { label: 'From the lecture', code: 'for i in hugehairypants:\n    print(i)\n    for j in hugehairypants:\n        print(j)' },
            { label: 'Words and numbers', code: 'for word in hugehairypants:\n    for n in range(1, 3):\n        print(word, n)' },
          ],
        },
        starter: `hugehairypants = [${HHP.map(JSON.stringify).join(', ')}]

# 1. Write a two-level loop (a loop inside a loop) that prints every pair of
#    the three words, one pair per line: huge huge, huge hairy, huge pants, ...


# 2. How many lines does your program print in total? Explain how you know.
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 5, text: 'Write a two-level loop (a loop inside a loop) that prints every pair of the three words, for example <code>huge huge</code>, <code>huge hairy</code>, and so on. Each pair prints on its own line.',
            hint: 'The outer loop picks the first word; the inner loop, indented inside it, picks the second. <code>print(a, b)</code> prints two things with a space between. Step through <em>From the lecture</em> in the picture: on every outer turn, the inner loop takes all its turns.',
            cell: { prog: PAIRS, label: '# hugehairypants is already set. Type the loop inside a loop:', ph: 'for … in hugehairypants:\n    for … in hugehairypants:\n        print(…, …)', must: [/\bfor\b[\s\S]*\bfor\b/, 'Right lines, but the task asks for a loop inside a loop: two for lines.'], traps: [NO_INDENT], anchor: '#    the three words, one pair per line: huge huge, huge hairy, huge pants, ...' },
            check: c => loopPrints(c, PAIRS(HHP), l => l.kind === 'for' && l.depth >= 2),
          },
          {
            pts: 5, text: 'How many lines will your program print in total? Explain how you know.',
            hint: 'Count the turns in the picture: how many outer turns, and how many inner turns on each one?',
            cell: { why: true, ok: s => /\b9\b|nine/i.test(s), label: '# How many lines, and how do you know?', ph: 'It prints … lines because …', rows: 2, okMsg: '✓ that is the number. Your teacher grades the how.', whyHint: 'Say the number, and how the three outer turns and three inner turns give it.', anchor: '#    Write your answer as comments below.' },
            check: c => { const n = c.notes(2); return n.length >= 10 && /\b9\b|nine/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
    ],
  };
})();
