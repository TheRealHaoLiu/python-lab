/* Lesson content: the Python shell, variables and types, arithmetic (Homework 1).
   Same shape as hw5/lesson.js. The posted Q2 (make a pythonClass folder on your own computer)
   has nothing to hand in here. Points are the page's own: the posting gives none. */
(function () {
  const has = (c, re) => re.test(c.code);
  const BIG = '1267650600228229401496703205376';
  const S3 = 'This is a StringThis is a StringThis is a String';
  // "a, b" or "a and b" in a comment, in either order (a plain "a" is also an English word)
  const pair = (x, y) => new RegExp(`\\b${x}\\b\\s*(,|and|&)\\s*\\b${y}\\b|\\b${y}\\b\\s*(,|and|&)\\s*\\b${x}\\b`, 'i');
  // the right names, and none of the wrong ones ("a" alone is also an English word, so it is not counted as wrong)
  const INT_OK = s => pair('a', 'b').test(s) && !/\b[cde]\b/i.test(s);
  const STR_OK = s => pair('c', 'e').test(s) && !/\b[bd]\b/i.test(s);
  const FLOAT_OK = s => /(^|[^a-z])d([^a-z]|$)/i.test(s) && !/\b[bce]\b/i.test(s);
  const DIV_RE = /decimal|float|whole|integer|\bint\b|round|fraction|point|remainder|divid|\.33|33\.3/i;
  const OPS = [/power|exponent|squar|cube|raise|itself/i, /remainder|mod|left ?over|rest|divid/i, /multipl|times|repeat|copies|product/i];

  window.LESSON = {
    id: 'hw1',
    title: 'Homework 1: The Python Shell',
    questions: [
      {
        id: 'q1', title: 'Try the Shell', var: 'a', vars: ['a', 'b', 'c', 'd', 'e'], setup: '', init: () => ({}),
        cellSetup: 'a = 1\nb = 2\nc = "This is a String"\nd = 1.0',  // the picture starts empty; the check boxes don't
        starter: `# The 13 lines from the homework, as a script. In the shell, a line like  a+b
# shows its value by itself. In a script it shows nothing: wrap it in print().
a = 1
b = 2
a+b
c = "This is a String"
print (c)
d = 1.0
100/3
100//3
2**100
29%7
20%3
e = c*3
print(e)

# 8. How many variables did we use above? Write your answer as a comment below.


# 9. List all the integer variables (just the names, like  x, y):


# 10. List all the string variables:


# 11. List all the floating variables:
`,
        tasks: [
          {
            pts: 5, text: 'In the script, <code>a+b</code> on its own shows nothing. Change it to <code>print(a+b)</code>.',
            hint: 'The shell answers every line; a script only prints what you tell it to. Press the <code>a+b</code> line in the picture, then look at the script.',
            cell: { expect: '3', label: '# a and b are set. Type the print line:', ph: 'print(a+b)', must: [/\ba\s*\+\s*b\b/, 'Right number, but add the two variables: a+b.'] },
            check: c => c.printed('3') && has(c, /print\s*\(\s*a\s*\+\s*b\s*\)/),
          },
          {
            pts: 5, text: 'Change <code>100/3</code> to <code>print(100/3)</code>. One slash divides and keeps the decimals.',
            hint: 'The answer is 33.333333333333336: a float.',
            cell: { expect: '33.333333333333336', free: true, label: '# Type the print line for 100/3:', ph: 'print(100/3)', must: [/100\s*\/\s*3/, 'Right number, but get it by dividing: 100/3.'] },
            check: c => c.printed('33.333333333333336') && has(c, /print\s*\(\s*100\s*\/\s*3\s*\)/),
          },
          {
            pts: 5, text: 'Change <code>100//3</code> to <code>print(100//3)</code>. Two slashes keep only the whole number.',
            hint: 'The answer is 33: an int. Compare it with 100/3 just above; that difference is Q2 below.',
            cell: { expect: '33', free: true, label: '# Type the print line for 100//3:', ph: 'print(100//3)', must: [/100\s*\/\/\s*3/, 'Right number, but get it with two slashes: 100//3.'] },
            check: c => c.printed('33') && has(c, /print\s*\(\s*100\s*\/\/\s*3\s*\)/),
          },
          {
            pts: 5, text: 'Change <code>2**100</code> to <code>print(2**100)</code>. Two stars raise to a power.',
            hint: '2 to the 100th power is a 31-digit number. Python does not mind.',
            cell: { expect: BIG, free: true, label: '# Type the print line for 2**100:', ph: 'print(2**100)', must: [/2\s*\*\*\s*100/, 'Right number, but get it with the power operator: 2**100.'] },
            check: c => c.printed(BIG) && has(c, /print\s*\(\s*2\s*\*\*\s*100\s*\)/),
          },
          {
            pts: 5, text: 'Change <code>29%7</code> to <code>print(29%7)</code>. The percent sign gives the remainder.',
            hint: '29 is four sevens (28) and 1 left over, so the answer is 1.',
            cell: { expect: '1', free: true, label: '# Type the print line for 29%7:', ph: 'print(29%7)', must: [/29\s*%\s*7/, 'Right number, but get it with the remainder operator: 29%7.'] },
            check: c => c.printed('1') && has(c, /print\s*\(\s*29\s*%\s*7\s*\)/),
          },
          {
            pts: 5, text: 'Change <code>20%3</code> to <code>print(20%3)</code>.',
            hint: '20 is six threes (18) and 2 left over.',
            cell: { expect: '2', free: true, label: '# Type the print line for 20%3:', ph: 'print(20%3)', must: [/20\s*%\s*3/, 'Right number, but get it with the remainder operator: 20%3.'] },
            check: c => c.printed('2') && has(c, /print\s*\(\s*20\s*%\s*3\s*\)/),
          },
          {
            pts: 5, text: 'The last two lines, <code>e = c*3</code> and <code>print(e)</code>, already print. Run the script and look at what <code>c*3</code> made.',
            hint: 'A string times 3 is the string three times in a row. Press <code>e = c*3</code> and then <code>print(e)</code> in the picture.',
            cell: { expect: "'" + S3 + "'", label: '# c is set. Type the expression that makes e:', ph: 'c*3', must: [/\bc\s*\*\s*3\b|\b3\s*\*\s*c\b/, 'Right text, but make it from c: c*3.'] },
            check: c => c.printed(S3) && has(c, /\be\s*=\s*c\s*\*\s*3\b/) && has(c, /print\s*\(\s*e\s*\)/),
          },
          {
            pts: 5, text: 'How many variables did we use in the example? Answer as a comment.',
            hint: 'Count the names on the left of an <code>=</code>. The picture shows each one as it gets set.',
            cell: { why: true, ok: s => /\b5\b|five/i.test(s), label: '# How many variables?', ph: 'We used … variables', rows: 1, okMsg: '✓ right. Put it in homework.py as a comment under task 8.', whyHint: 'Count the labels in the picture after all 13 lines.', anchor: '# 8. How many variables did we use above? Write your answer as a comment below.' },
            check: c => /\b5\b|five/i.test(c.notes(8)),
          },
          {
            pts: 5, text: 'List all the <strong>integer</strong> variables.',
            hint: 'Whole numbers, no decimal point. The type badge in the picture says <code>int</code>.',
            cell: { why: true, ok: INT_OK, label: '# The integer variables are:', ph: 'x, y', rows: 1, okMsg: '✓ right. Add it to homework.py under task 9.', whyHint: 'Name the variables whose badge says int, separated by commas.', anchor: '# 9. List all the integer variables (just the names, like  x, y):' },
            check: c => INT_OK(c.notes(9)),
          },
          {
            pts: 5, text: 'List all the <strong>string</strong> variables.',
            hint: 'Text in quotes. The badge says <code>str</code>. There are two: one was made from the other.',
            cell: { why: true, ok: STR_OK, label: '# The string variables are:', ph: 'x, y', rows: 1, okMsg: '✓ right. Add it to homework.py under task 10.', whyHint: 'Name the variables whose badge says str.', anchor: '# 10. List all the string variables:' },
            check: c => STR_OK(c.notes(10)),
          },
          {
            pts: 5, text: 'List all the <strong>floating</strong> (decimal) variables.',
            hint: 'A number with a decimal point, even <code>.0</code>. The badge says <code>float</code>.',
            cell: { why: true, ok: FLOAT_OK, label: '# The floating variables are:', ph: 'x', rows: 1, okMsg: '✓ right. Add it to homework.py under task 11.', whyHint: 'Name the variable whose badge says float.', anchor: '# 11. List all the floating variables:' },
            check: c => FLOAT_OK(c.notes(11)),
          },
        ],
      },
      {
        id: 'q2', title: 'What the Operators Do', var: 'x', vars: ['x', 'y'], setup: 'x = 100\ny = 3', init: () => ({ x: 100, y: 3 }),
        starter: `# 1. What is the difference between 100/3 and 100//3?
#    Write your answer as comments below.


# 2. Explain the meaning of the operators ** , % and *. You may use examples.
#    Write your answer as comments below. You can print examples too.
`,
        tasks: [
          {
            pts: 20, text: 'What is the difference between <code>100/3</code> and <code>100//3</code>? Answer in comments.',
            hint: 'Press both in the picture and compare: one keeps the decimals, one keeps only the whole number. Check their types too.',
            cell: { why: true, re: DIV_RE, label: '# 100/3 and 100//3 are different because…', ph: 'One slash gives…, two slashes give…', whyHint: 'Say what each one gives for 100 and 3, and what kind of number it is.', anchor: '#    Write your answer as comments below.' },
            check: c => c.notes(1).length >= 15 && DIV_RE.test(c.notes(1)), doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 25, text: 'Explain the meaning of the last three operators: <code>**</code>, <code>%</code> and <code>*</code>. You may use examples.',
            hint: 'Press <code>x ** 2</code>, <code>x % y</code> and <code>y * "ab"</code> in the picture. One sentence each: what does it do, with an example.',
            cell: { why: true, re: /.*/, ok: s => OPS.filter(re => re.test(s)).length >= 2, label: '# ** means…, % means…, * means…', ph: '** raises to a power, for example 2**100 is… % gives… * …', rows: 3, okMsg: '✓ answered. Add it to homework.py; your teacher grades the explanation.', whyHint: 'Cover all three: ** (power), % (remainder) and * (multiply, and repeat for strings).', anchor: '#    Write your answer as comments below. You can print examples too.' },
            check: c => { const n = c.notes(2); return n.length >= 20 && OPS.filter(re => re.test(n)).length >= 2; }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
    ],
  };
})();
