/* Lesson content: Tuples & Lists.
   Each question has a variable shown in the picture, the setup line, a starter
   homework.py, and tasks. A task has:
     pts, text (HTML), hint (HTML, optional)
     cell   – the assert practice box:
              {expect: '<python literal>'}             student types an expression
              {stmt: true, asserts: ['<python expr>']} student types a statement
              {why: true, tryCode: '<python>'}         written explanation
              must: [regex, message]  extra rule on what they typed
     check(c) – grades homework.py. c.printed(text), c.printedAny([...]),
              c.code (script without comments), c.final(items => bool), c.explained()
*/
(function () {
  const SP = "('fireball', 'ice blast', 'thunder strike', 'healing light', 'shadow step')";
  const TR = "((3, 5), (7, 2), (9, 8), (1, 4))";
  const OR0 = "['cheese pizza', 'garlic bread', 'soda', 'salad', 'brownie']";
  const OR1 = "['cheese pizza', 'garlic bread', 'soda', 'chicken wings', 'ice cream']";
  const has = (c, re) => re.test(c.code);
  const NEG = [/\[\s*-/, 'Right value, but the task asks for a negative index.'];
  const SLICE = [/:/, 'Right value, but the task asks for a slice: [start:stop].'];
  const LEN = [/len\s*\(/, 'Right value, but the task asks you to use len().'];
  const T = items => ({ t: 'tuple', items }), L = items => ({ t: 'list', items });

  const TR_SLICES = (() => {
    const it = ['(3, 5)', '(7, 2)', '(9, 8)', '(1, 4)'], out = [];
    for (let a = 0; a < 4; a++) for (let b = a + 2; b <= 4; b++) if (b - a < 4) out.push('(' + it.slice(a, b).join(', ') + ')');
    return out;
  })();

  window.LESSON = {
    id: 'hw5',
    title: 'Homework 5: Tuples & Lists',
    questions: [
      {
        id: 'q1', title: 'Magic Spell Book', var: 'spells', setup: 'spells = ' + SP,
        init: () => T(['fireball', 'ice blast', 'thunder strike', 'healing light', 'shadow step']),
        starter: `spells = ${SP}

# 1. Print the whole tuple using print(spells)


# 2. Print just the second spell (Python starts counting at 0!)


# 3. Print a slice showing the first three spells


# 4. Print the last spell using negative indexing


# 5. A student tries to run:   spells[0] = 'meteor'
#    What happens? Why? Write your answer as comments below.
`,
        tasks: [
          { pts: 5, text: 'Print the whole tuple using <code>print(spells)</code>.', cell: { expect: SP }, check: c => c.printed(SP) },
          { pts: 10, text: 'Print just the second spell. Remember: Python starts counting at 0!', hint: 'The first spell is at index 0, so the second is at index 1.', cell: { expect: "'ice blast'" }, check: c => c.printed('ice blast') && has(c, /spells\s*\[\s*(1|-\s*4)\s*\]/) },
          { pts: 10, text: 'Print a slice showing the first three spells.', hint: 'A slice <code>[start:stop]</code> stops <em>before</em> the stop index. Use the slice explorer to find the right numbers.', cell: { expect: "('fireball', 'ice blast', 'thunder strike')", must: SLICE }, check: c => c.printed("('fireball', 'ice blast', 'thunder strike')") && has(c, /spells\s*\[[^\]]*:[^\]]*\]/) },
          { pts: 10, text: 'Print the last spell using negative indexing.', hint: '<code>spells[-1]</code> counts one step back from the end.', cell: { expect: "'shadow step'", must: NEG }, check: c => c.printed('shadow step') && has(c, /spells\s*\[\s*-\s*1\s*\]/) },
          { pts: 15, text: "A student tries <code>spells[0] = 'meteor'</code>. What happens? Why? Answer in comments (lines starting with <code>#</code>).", hint: 'Run the line below to see what Python says. Then explain it in your own words.', cell: { why: true, tryCode: "spells[0] = 'meteor'" }, check: c => c.explained(), doneLabel: 'answered (teacher grades this one)' },
        ],
      },
      {
        id: 'q2', title: 'Treasure Chest Coordinates', var: 'treasure', setup: 'treasure = ' + TR,
        init: () => T([T([3, 5]), T([7, 2]), T([9, 8]), T([1, 4])]),
        starter: `treasure = ${TR}

# 1. Print the entire treasure tuple


# 2. Print the first coordinate pair using treasure[0]


# 3. Print only the number 9 from the third coordinate pair


# 4. Print a slice of the coordinate pairs (for example, the first two)


# 5. Use len(treasure) to print how many coordinate pairs there are
`,
        tasks: [
          { pts: 5, text: 'Print the entire treasure tuple.', cell: { expect: TR }, check: c => c.printed(TR) },
          { pts: 10, text: 'Print the first coordinate pair using <code>treasure[0]</code>.', cell: { expect: '(3, 5)', must: [/\[\s*0\s*\]/, 'Right value, but the task asks you to use treasure[0].'] }, check: c => c.printed('(3, 5)') && has(c, /treasure\s*\[\s*(0|-\s*4)\s*\]/) },
          { pts: 10, text: 'Print only the number 9 from the third coordinate pair.', hint: 'First get the third pair with <code>treasure[2]</code>, then add a second <code>[ ]</code> to get the first number inside it.', cell: { expect: '9', must: [/\]\s*\[/, 'Right value. Now reach it with two sets of brackets: treasure[pair][number].'] }, check: c => c.printed('9') && has(c, /treasure\s*\[[^\]]+\]\s*\[[^\]]+\]/) },
          { pts: 10, text: 'Print a slice showing some of the coordinate pairs, for example the first two.', hint: 'Same slicing as Q1: <code>treasure[start:stop]</code>.', cell: { expect: '((3, 5), (7, 2))', must: SLICE }, check: c => c.printedAny(TR_SLICES) && has(c, /treasure\s*\[[^\]]*:[^\]]*\]/) },
          { pts: 5, text: 'Use <code>len(treasure)</code> to print how many coordinate pairs are in the tuple.', cell: { expect: '4', must: LEN }, check: c => c.printed('4') && has(c, /len\s*\(\s*treasure\s*\)/) },
        ],
      },
      {
        id: 'q3', title: 'Pizza Party Orders', bonus: true, syncPicture: true, var: 'order', setup: 'order = ' + OR0,
        init: () => L(['cheese pizza', 'garlic bread', 'soda', 'salad', 'brownie']),
        starter: `order = ${OR0}

# 1. Print the whole order list


# 2. Print just the third item


# 3. Change 'salad' to 'chicken wings' using indexing


# 4. Add 'ice cream' to the end of the list using .append()


# 5. The customer cancels the brownie. Remove it using del order[4]


# 6. Print the updated list


# 7. Print a slice showing the first three items of the updated list


# 8. Print the last item using negative indexing


# 9. Print how many items are in the list using len(order)
`,
        tasks: [
          { pts: 5, text: 'Print the whole order list.', cell: { expect: OR0 }, check: c => c.printed(OR0) },
          { pts: 5, text: 'Print just the third item.', hint: 'Third item, index 2.', cell: { expect: "'soda'" }, check: c => c.printed('soda') && has(c, /order\s*\[\s*(2|-\s*3)\s*\]/) },
          { pts: 5, text: "Change <code>'salad'</code> to <code>'chicken wings'</code> using indexing.", hint: "Which index holds 'salad'? Then write <code>order[?] = 'chicken wings'</code>.", cell: { stmt: true, asserts: ["order == ['cheese pizza', 'garlic bread', 'soda', 'chicken wings', 'brownie']"], must: [/\]\s*=[^=]/, "Change it with indexing: order[?] = 'chicken wings'."] }, check: c => c.final(o => o.includes('chicken wings') && !o.includes('salad')) && has(c, /order\s*\[[^\]]+\]\s*=[^=]/) },
          { pts: 5, text: "Add <code>'ice cream'</code> to the end of the list using <code>.append()</code>.", cell: { stmt: true, asserts: ["order[-1] == 'ice cream'", 'len(order) == 6'], must: [/\.append\s*\(/, 'Use .append() for this one.'] }, check: c => c.final(o => o.includes('ice cream')) && has(c, /order\s*\.\s*append\s*\(/) },
          { pts: 10, text: "The customer cancels the <code>'brownie'</code>. Remove it using <code>del order[4]</code>.", hint: 'Do this after the append. Why does index 4 still point at the brownie?', cell: { stmt: true, asserts: ["'brownie' not in order", 'order == ' + OR1], must: [/\bdel\b/, 'Use del for this one.'] }, check: c => c.final(o => !o.includes('brownie')) && has(c, /\bdel\s+order\s*\[/) },
          { pts: 5, text: 'Print the updated list after the deletion.', cell: { expect: OR1 }, check: c => c.printed(OR1) },
          { pts: 5, text: 'Print a slice showing the first three items of the updated list.', cell: { expect: "['cheese pizza', 'garlic bread', 'soda']", must: SLICE }, check: c => c.printed("['cheese pizza', 'garlic bread', 'soda']") && has(c, /order\s*\[[^\]]*:[^\]]*\]/) },
          { pts: 5, text: 'Print the last item using negative indexing.', cell: { expect: "'ice cream'", must: NEG }, check: c => c.printed('ice cream') && has(c, /order\s*\[\s*-\s*1\s*\]/) },
          { pts: 5, text: 'Print how many items are in the list using <code>len(order)</code>.', cell: { expect: '5', must: LEN }, check: c => c.printed('5') && has(c, /len\s*\(\s*order\s*\)/) },
        ],
      },
    ],
  };
})();
