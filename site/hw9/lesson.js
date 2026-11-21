/* Lesson content: number sequences with loops, for vs while, break and continue.
   Same shape as hw8/lesson.js (loop pictures, prog cells, c.loops), plus:
     cell.outOk(lines, input) – a code box whose printed lines the lesson judges itself
                                (true, or a hint string): any wording, same numbers
     c.loops[i].jumps         – ['break', 'continue'] that the loop itself uses
   The loop picture steps through break/continue: the line that jumped gets a chip,
   the rest of the body is dimmed for that turn, and break ends the loop.
*/
(function () {
  const norm = s => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
  const same = (got, want) => got.length === want.length && got.every((l, i) => norm(l) === norm(want[i]));
  const loopPrints = (c, want, extra = () => true) => c.loops.some(l => extra(l) && same(l.out, want));
  const RANGE = (a, b) => new RegExp(`^range\\(\\s*${a}\\s*,\\s*${b}\\s*\\)$`);
  const RANGE_TYPED = (a, b) => new RegExp(`range\\s*\\(\\s*${a}\\s*,\\s*${b}\\s*\\)`);
  const nums = (a, b) => { const o = []; for (let k = a; k < b; k++) o.push(String(k)); return o; };
  const numsIn = l => (String(l).match(/-?\d+/g) || []).map(Number);
  const uses = (l, kind) => (l.jumps || []).includes(kind);
  const NO_INDENT = [/^(for|while)[^\n]*:\s*\n(?!\s)/m, 'The lines under for or while must be indented 4 spaces.'];

  // Q1 task 1: one line per n from 1 to 100, each showing n and n**2 (any wording)
  const SQUARES = lines => {
    if (!lines.length) return 'Nothing was printed. Put a print inside the loop.';
    const bad = lines.findIndex((l, i) => { const ns = numsIn(l); return !(ns.includes(i + 1) && ns.includes((i + 1) * (i + 1))); });
    if (bad >= 0 && bad < 100) return `Line ${bad + 1} is "${lines[bad]}". It should show n = ${bad + 1} and its square, ${(bad + 1) * (bad + 1)}.`;
    if (lines.length > 100) return `The last line is "${lines[lines.length - 1]}": that square is more than 10000. The loop should stop before printing it.`;
    if (lines.length < 100) return `It stops after "${lines[lines.length - 1]}". Keep going while n**2 is still 10000 or less.`;
    return true;
  };
  // Q1 task 2: the first 20 Fibonacci numbers, 0 to 4181, one per line or all on one line
  const FIB = (() => { const o = []; let a = 0, b = 1; for (let i = 0; i < 20; i++) { o.push(a); [a, b] = [b, a + b]; } return o; })();
  const FIB20 = lines => {
    const all = lines.flatMap(numsIn), last = lines.map(l => numsIn(l).pop());
    if (all.join() === FIB.join() || (lines.length === 20 && last.join() === FIB.join())) return true;
    if (all.join() === FIB.slice(1).concat(6765).join() || last.join() === FIB.slice(1).concat(6765).join())
      return 'So close: your numbers start at 1. The sequence starts 0, 1, 1, 2, … Which of a and b holds 0 on the first turn?';
    if (!lines.length) return 'Nothing was printed. Put a print inside the loop.';
    return `It prints ${all.length} number${all.length === 1 ? '' : 's'}, starting ${all.slice(0, 4).join(', ')}. It should print 20 of them, starting 0, 1, 1, 2.`;
  };
  // Q2 task 5: "stops when the number reaches 10": 1 to 9 or 1 to 10 are both fair readings
  const UPTO10 = lines => same(lines, nums(1, 10)) || same(lines, nums(1, 11)) ? true
    : lines.length > 11 ? `It prints ${lines.length} lines. break should stop the loop at 10.` : `It prints ${lines.length ? lines.map(l => `"${l}"`).slice(0, 4).join(', ') + (lines.length > 4 ? ', …' : '') : 'nothing'}. It should print 1, 2, 3, … and stop at 10.`;

  const FIB_CLASS = 'aListOfFibs = [0, 1]\na = 0\nb = 1\nwhile b < 1000000:\n    a, b = b, a + b\n    if b == 987:\n        continue\n    aListOfFibs.append(b)\n    if b > 250000:\n        break\nprint(aListOfFibs)';
  const BONUS = 'result = []\na = 3\nb = 7\nwhile len(result) < 8:\n    if a % 2 == 0:\n        result.append(a + b)\n        a = a + 1\n    else:\n        result.append(a * b)\n        a = a + 2\n        b = b + 1\nprint(result)';
  const ALWAYS = /\bwhile\s*\(?\s*(True|1)\s*\)?\s*(:|\s|$)/;

  window.LESSON = {
    id: 'hw9',
    title: 'Homework 9: Sequences, break and continue',
    questions: [
      {
        id: 'q1', title: 'Number Sequences with Loops', var: 'n', vars: ['n', 'a', 'b'],
        setup: 'n = 1\na = 0\nb = 1',
        init: () => ({ n: 1, a: 0, b: 1 }),
        loop: {
          watch: ['n', 'a', 'b', 'i'], tester: 'range(20)',
          programs: [
            { label: 'Cubes up to 100', code: 'n = 1\nwhile n ** 3 <= 100:\n    print(n, n ** 3)\n    n = n + 1' },
            { label: 'Swap trick: 2 and 1', code: 'a = 2\nb = 1\nfor i in range(6):\n    print(a)\n    a, b = b, a + b' },
            { label: 'Loop A', code: 'for i in range(10):\n    print(i)' },
            { label: 'Loop B', code: 'i = 0\nwhile i < 10:\n    print(i)\n    i = i + 1' },
          ],
        },
        starter: `# 1. Squares: write a loop that prints each n and its square n**2,
#    starting with n at 1. Stop when n**2 is greater than 10000.
n = 1


# 2. Fibonacci: write a loop using range(20) that generates and prints the
#    first 20 Fibonacci numbers. Start with a = 0 and b = 1, and update them
#    with  a, b = b, a + b


# 3. In your own words: why is a for loop a good choice for generating the
#    first 20 Fibonacci numbers? Write your answer as comments below.


# 4. Suppose we want Fibonacci numbers but don't know in advance how many
#    there will be. Would a for loop or a while loop be the better choice?
#    Explain why. Write your answer as comments below.


# 5. Look at these two loops:
#        # Loop A
#        for i in range(10):
#            print(i)
#
#        # Loop B
#        i = 0
#        while i < 10:
#            print(i)
#            i = i + 1
#    Both print the numbers 0 through 9. Explain ONE situation where you
#    would prefer Loop A and ONE situation where you would prefer Loop B.
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 15, text: '<b>Squares.</b> Write a loop that prints each <code>n</code> and its square <code>n**2</code>, starting at <code>n = 1</code>, and stops when <code>n**2</code> is greater than 10000.',
            hint: 'A <code>while</code> loop fits: its check is the rule for keeping going. Step through <em>Cubes up to 100</em> in the picture; yours is the same shape with squares and 10000. Don\'t forget to make <code>n</code> one bigger on every turn.',
            cell: { prog: () => null, outOk: SQUARES, values: [1], start: 'n = 1\n', label: '# n starts at 1. Write the loop:', ph: 'n = 1\nwhile …:\n    print(…)\n    n = …', traps: [NO_INDENT, [/n\s*\*\*\s*2\s*<\s*10000/, 'Careful: < 10000 stops one turn early. 100 × 100 is exactly 10000, and that one counts.']], okMsg: '✓ 100 lines, from 1 1 up to 100 10000', anchor: '#    starting with n at 1. Stop when n**2 is greater than 10000.' },
            check: c => c.loops.some(l => SQUARES(l.out) === true),
          },
          {
            pts: 10, text: '<b>Fibonacci.</b> The sequence starts 0, 1, 1, 2, 3, 5, 8: each number is the sum of the two before it. Write a loop using <code>range(20)</code> that generates and prints the first 20 Fibonacci numbers. Start with <code>a = 0</code> and <code>b = 1</code>, and update them with <code>a, b = b, a + b</code>.',
            hint: '<code>range(20)</code> gives 20 turns. On each turn print one number, then move both along with <code>a, b = b, a + b</code>. Step through <em>Swap trick: 2 and 1</em> in the picture and watch <code>a</code> and <code>b</code> after each turn.',
            cell: { prog: () => null, outOk: FIB20, values: [1], label: '# Type a = 0, b = 1 and the loop:', ph: 'a = 0\nb = 1\nfor i in range(20):\n    …', must: [/range\s*\(\s*20\s*\)/, 'Right numbers, but the task asks you to use range(20).'], traps: [NO_INDENT], okMsg: '✓ the first 20: 0, 1, 1, 2, … 4181', anchor: '#    with  a, b = b, a + b' },
            check: c => c.loops.some(l => l.kind === 'for' && /^range\(\s*20\s*\)$/.test(l.iter || '') && FIB20(l.out) === true),
          },
          {
            pts: 5, text: 'In your own words: why is a <code>for</code> loop a good choice for generating the first 20 Fibonacci numbers?',
            hint: 'What do you already know before the loop starts? What does <code>range(20)</code> promise?',
            cell: { why: true, re: /20|know|how many|fixed|exact|count|number of|range|times|turns/, label: '# Why is a for loop a good choice here?', ph: 'Because we already know …', whyHint: 'Say what we know before the loop starts, and how a for loop with range uses that.', anchor: '#    first 20 Fibonacci numbers? Write your answer as comments below.' },
            check: c => { const n = c.notes(3); return n.length >= 15 && /20|know|how many|fixed|exact|count|number of|range|times|turns/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'Suppose we want Fibonacci numbers but don\'t know in advance how many there will be. Would a <code>for</code> loop or a <code>while</code> loop be the better choice? Explain why.',
            hint: 'A <code>for</code> loop needs its list or <code>range()</code> before it starts. What does the other kind of loop look at before each turn instead?',
            cell: { why: true, ok: s => /\bwhile\b/i.test(s) && s.trim().length >= 15, label: '# for or while? Why?', ph: 'A … loop, because …', okMsg: '✓ answered. Your teacher grades the why.', whyHint: 'Name the loop you would pick, and say what it checks that a for loop can\'t.', anchor: '#    Explain why. Write your answer as comments below.' },
            check: c => { const n = c.notes(4); return n.length >= 15 && /\bwhile\b/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 15, text: 'Look at these two loops:<pre># Loop A\nfor i in range(10):\n    print(i)\n\n# Loop B\ni = 0\nwhile i &lt; 10:\n    print(i)\n    i = i + 1</pre>Both print the numbers 0 through 9. Explain ONE situation where you would prefer Loop A and ONE situation where you would prefer Loop B.',
            hint: 'Step through <em>Loop A</em> and <em>Loop B</em> in the picture. Which one has a line that can go wrong if you forget it? Which one could stop on a rule like "until the total is over 1000"?',
            cell: { why: true, ok: s => s.trim().length >= 30 && /\bA\b|for/i.test(s) && /\bB\b|while/i.test(s), label: '# When would you pick Loop A? When Loop B?', ph: 'Loop A when … Loop B when …', rows: 4, okMsg: '✓ answered. Your teacher grades the situations.', whyHint: 'Give one situation for Loop A and one for Loop B, and name both.', anchor: '#    would prefer Loop A and ONE situation where you would prefer Loop B.\n#    Write your answer as comments below.' },
            check: c => { const n = c.notes(5); return n.length >= 30 && /\bA\b|for/i.test(n) && /\bB\b|while/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
      {
        id: 'q2', title: 'break and continue', var: 'aListOfFibs', vars: ['aListOfFibs', 'a', 'b'],
        setup: 'aListOfFibs = [0, 1]\na = 0\nb = 1',
        init: () => ({ aListOfFibs: { t: 'list', items: [0, 1] }, a: 0, b: 1 }),
        loop: {
          watch: ['a', 'b', 'i', 'word'], tester: 'range(1, 11)', limit: 60,
          programs: [
            { label: 'From class', code: FIB_CLASS },
            { label: 'Try: no break', code: 'aListOfFibs = [0, 1]\na = 0\nb = 1\nwhile b < 1000000:\n    a, b = b, a + b\n    if b == 987:\n        continue\n    aListOfFibs.append(b)\nprint(aListOfFibs)' },
            { label: 'Skip the odd ones', code: 'for i in range(1, 8):\n    if i % 2 == 1:\n        continue\n    print(i)' },
            { label: 'Stop at STOP', code: "for word in ['red', 'green', 'STOP', 'blue']:\n    if word == 'STOP':\n        break\n    print(word)\nprint('done')" },
          ],
        },
        starter: `# This code is from class. Run it and look at what it prints.
${FIB_CLASS}

# 1. What does the continue statement do when b == 987?
#    Write your answer as comments below.


# 2. What does the break statement do when b > 250000?
#    Write your answer as comments below.


# 3. What would happen if we removed the break statement? How would the
#    output change? Write your answer as comments below.


# 4. Write a loop using range(1, 11) that prints each number, but skips
#    the number 5 using continue.


# 5. Write a loop using range(1, 100) that prints each number, but stops
#    the loop when the number reaches 10 using break.


# 6. In your own words: what is the difference between break and continue?
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 10, text: 'Study the code from class (it is at the top of <code>homework.py</code> and in the picture, <em>From class</em>). What does the <code>continue</code> statement do when <code>b == 987</code>?',
            hint: 'Press <em>Next turn</em> until the <code>continue</code> line lights up. Which lines are dimmed on that turn? Then look for 987 in what it prints.',
            cell: { why: true, re: /skip|987|not (get )?(add|append|put)|isn'?t (add|append)|next|jump|back|top|start/, label: '# What does continue do when b == 987?', ph: 'It skips …', whyHint: 'Say which lines don\'t run on that turn, and what that means for 987 in the list.', anchor: '# 1. What does the continue statement do when b == 987?\n#    Write your answer as comments below.' },
            check: c => { const n = c.notes(1); return n.length >= 15 && /skip|987|not (get )?(add|append|put)|isn'?t (add|append)|next|jump|back|top|start/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: 'What does the <code>break</code> statement do when <code>b &gt; 250000</code>?',
            hint: 'Press <em>Run to the end</em> on <em>From class</em>. What is <code>b</code> on the last turn, and is <code>b &lt; 1000000</code> still True when the loop stops?',
            cell: { why: true, re: /stop|end|exit|out|leave|quit|finish|317811|done/, label: '# What does break do when b > 250000?', ph: 'It stops …', whyHint: 'Say what happens to the loop, and which line runs next.', anchor: '# 2. What does the break statement do when b > 250000?\n#    Write your answer as comments below.' },
            check: c => { const n = c.notes(2); return n.length >= 15 && /stop|end|exit|out|leave|quit|finish|317811|done/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'What would happen if we removed the <code>break</code> statement? How would the output change?',
            hint: 'Pick <em>Try: no break</em> in the picture and press <em>Run to the end</em>. What stops the loop now, and what is the last number?',
            cell: { why: true, re: /1000000|million|1346269|more|longer|keep|until|bigger|larger|while|check/, label: '# Without the break: what happens, and how does the output change?', ph: 'The loop would keep going until …', whyHint: 'Say what stops the loop instead, and what that does to the list it prints.', anchor: '#    output change? Write your answer as comments below.' },
            check: c => { const n = c.notes(3); return n.length >= 15 && /1000000|million|1346269|more|longer|keep|until|bigger|larger|while|check/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: 'Write a loop using <code>range(1, 11)</code> that prints each number, but skips the number 5 using <code>continue</code>.',
            hint: 'Inside the loop, an <code>if</code> checks for 5 and runs <code>continue</code>; the <code>print</code> comes after it. Step through <em>Skip the odd ones</em> in the picture: same idea, different rule.',
            cell: { prog: () => ['1', '2', '3', '4', '6', '7', '8', '9', '10'], values: [[0, 1]], label: '# Type the for loop with continue:', ph: 'for … in range(1, 11):\n    if …:\n        continue\n    print(…)', must: [/\bcontinue\b/, 'Right numbers, but the task asks you to skip 5 using continue.'], traps: [NO_INDENT, [/print[^\n]*\n\s*if[^\n]*\n\s*continue/, 'The print comes before the if, so 5 is printed before continue gets a chance. Put the check first.']], anchor: '#    the number 5 using continue.' },
            check: c => loopPrints(c, ['1', '2', '3', '4', '6', '7', '8', '9', '10'], l => l.kind === 'for' && RANGE(1, 11).test(l.iter || '') && uses(l, 'continue')),
          },
          {
            pts: 10, text: 'Write a loop using <code>range(1, 100)</code> that prints each number, but stops the loop when the number reaches 10 using <code>break</code>.',
            hint: 'Without the <code>break</code> this loop would print 99 lines. An <code>if</code> inside it checks for 10 and runs <code>break</code>. Step through <em>Stop at STOP</em> in the picture.',
            cell: { prog: () => null, outOk: UPTO10, values: [[0, 1]], label: '# Type the for loop with break:', ph: 'for … in range(1, 100):\n    if …:\n        break\n    print(…)', must: [/\bbreak\b/, 'Right numbers, but the task asks you to stop the loop using break.'], traps: [NO_INDENT, [/range\s*\(\s*1\s*,\s*(10|11)\s*\)/, 'The task asks for range(1, 100). break does the stopping.']], okMsg: '✓ it stops at 10', anchor: '#    the loop when the number reaches 10 using break.' },
            check: c => c.loops.some(l => l.kind === 'for' && RANGE(1, 100).test(l.iter || '') && uses(l, 'break') && UPTO10(l.out) === true),
          },
          {
            pts: 5, text: 'In your own words: what is the difference between <code>break</code> and <code>continue</code>?',
            hint: 'Compare the two strips in the picture: after a <code>continue</code> turn, are there more turns? After a <code>break</code> turn?',
            cell: { why: true, ok: s => s.trim().length >= 20 && /break/i.test(s) && /continue/i.test(s), label: '# break vs continue:', ph: 'break … but continue …', rows: 3, okMsg: '✓ answered. Your teacher grades the explanation.', whyHint: 'Say what each one does: name both break and continue.', anchor: '# 6. In your own words: what is the difference between break and continue?\n#    Write your answer as comments below.' },
            check: c => { const n = c.notes(6); return n.length >= 20 && /break/i.test(n) && /continue/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
      {
        id: 'q3', title: 'A Sequence That Keeps Going', bonus: true, var: 'result', vars: ['result', 'a', 'b'],
        setup: 'result = []\na = 3\nb = 7',
        init: () => ({ result: { t: 'list', items: [] }, a: 3, b: 7 }),
        loop: {
          watch: ['a', 'b'],
          programs: [
            { label: "The student's loop", code: BONUS },
            { label: 'Only 4 items', code: BONUS.replace('< 8', '< 4') },
          ],
        },
        starter: `# A student wrote this loop to make a sequence of numbers:
${BONUS}

# 1. The student wants the sequence to keep going (instead of stopping after
#    8 items). Rewrite the while line. Write it as a comment below:
#    a loop that never ends would stop the rest of this file.


# 2. What will the output be with your new while line? Explain why.
#    Write your answer as comments below.
`,
        tasks: [
          {
            pts: 5, text: 'A student wrote the loop above (it is in <code>homework.py</code> and in the picture). When the student runs it, the output is <code>[21, 40, 63, 90, 121, 156, 195, 238]</code>. Now the student wants the sequence to keep going, instead of stopping after 8 items. Rewrite the <code>while</code> line.',
            hint: 'The loop stops when its check becomes <code>False</code>. Compare <em>Only 4 items</em> with the student\'s loop: the check decides how many turns there are. What check is never <code>False</code>? (<code>True</code> has a capital T.)',
            cell: { why: true, ok: s => ALWAYS.test(s.trim()), label: '# Your new while line:', ph: 'while …:', rows: 1, okMsg: '✓ that check is never False, so the loop keeps going', whyHint: 'Write one while line whose check never becomes False.', anchor: '#    a loop that never ends would stop the rest of this file.' },
            check: c => ALWAYS.test(c.notes(1).trim()), doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'What will the output be with your new <code>while</code> line? Explain why.',
            hint: 'Where is the <code>print</code>: inside the loop or after it? When does the line after a loop run? You can try your new loop at the <code>&gt;&gt;&gt;</code> prompt: Python stops it after 20000 steps.',
            cell: { why: true, re: /never|nothing|forever|infinite|endless|no output|(doesn'?t|does not|won'?t|will not) (print|stop|end)|keeps? going|stuck/, label: '# What will it print, and why?', ph: 'It will …, because the print is …', rows: 3, whyHint: 'Say what gets printed (if anything), and where the print line is.', anchor: '# 2. What will the output be with your new while line? Explain why.\n#    Write your answer as comments below.' },
            check: c => { const n = c.notes(2); return n.length >= 15 && /never|nothing|forever|infinite|endless|no output|(doesn'?t|does not|won'?t|will not) (print|stop|end)|keeps? going|stuck/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
    ],
  };
})();
