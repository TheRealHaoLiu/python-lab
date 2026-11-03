/* Lesson content: variables, numbers and printing (Homework 2).
   Same shape as hw5/lesson.js. Grading helpers used here:
     c.value(name) – a plain variable as the script left it (number, string, or repr text)
   Points are the page's own, except the bonus: the posting says "Bonus (50 Points)". */
(function () {
  const has = (c, re) => re.test(c.code);
  const isStr = v => typeof v === 'string', isNum = v => typeof v === 'number' || (isStr(v) && /^-?\d+(\.\d+)?$/.test(v));
  const num = v => typeof v === 'number' ? v : parseFloat(v);
  // the script assigns `name` a string literal / a number
  const SETS_STR = name => new RegExp(`^\\s*${name}\\s*=\\s*(["']).+\\1\\s*$`, 'm');
  const SETS_NUM = name => new RegExp(`^\\s*${name}\\s*=\\s*-?\\d+(\\.\\d+)?\\s*$`, 'm');
  // area = 3.1416 * radius ** 2 (also radius * radius, or the factors the other way round)
  const FORMULA = /area\s*=\s*(3\.1416\s*\*\s*(radius\s*\*\*\s*2|radius\s*\*\s*radius|\(\s*radius\s*\*\*\s*2\s*\))|(radius\s*\*\*\s*2|radius\s*\*\s*radius)\s*\*\s*3\.1416)/;
  const areaOK = c => { const r = num(c.value('radius')), a = num(c.value('area')); return Number.isFinite(r) && Number.isFinite(a) && Math.abs(a - 3.1416 * r * r) < 1e-6; };
  const printedArea = c => { const a = c.value('area'); return a !== undefined && a !== null && c.printed(String(a)); };

  window.LESSON = {
    id: 'hw2',
    title: 'Homework 2: Variables and Printing',
    questions: [
      {
        id: 'q1', title: 'Variables and Printing', var: 'first_name', vars: ['first_name', 'last_name', 'fred', 'john'],
        setup: '', init: () => ({}),
        starter: `# 1. Create a variable called first_name that stores your first name


# 2. Create a variable called last_name that stores your last name


# 3. Print your first name and last name using the two variables
`,
        tasks: [
          {
            pts: 15, text: 'Create a variable called <code>first_name</code> that stores your first name.',
            hint: 'A name is text, so it needs quotes: <code>first_name = "Ada"</code>. The <code>=</code> sticks the label <code>first_name</code> on that value.',
            cell: { stmt: true, asserts: ['type(first_name) == str', 'len(first_name) > 0'], must: [/first_name\s*=/, 'Call the variable first_name.'] },
            check: c => isStr(c.value('first_name')) && c.value('first_name').length > 0 && has(c, SETS_STR('first_name')),
          },
          {
            pts: 15, text: 'Create a variable called <code>last_name</code> that stores your last name.',
            hint: 'Same shape as the first one, with your last name in the quotes.',
            cell: { stmt: true, asserts: ['type(last_name) == str', 'len(last_name) > 0'], must: [/last_name\s*=/, 'Call the variable last_name.'] },
            check: c => isStr(c.value('last_name')) && c.value('last_name').length > 0 && has(c, SETS_STR('last_name')),
          },
          {
            pts: 20, text: 'Print your first name and last name using the two variables.',
            hint: '<code>print(first_name, last_name)</code> prints both with a space between. No quotes around the variable names, or Python prints the words first_name and last_name instead of what is in them.',
            check: c => { const f = c.value('first_name'), l = c.value('last_name'); if (!isStr(f) || !isStr(l) || !f || !l) return false; const both = c.outputs.some(o => o.includes(f) && o.includes(l)), two = c.printed(f) && c.printed(l); return (both || two) && has(c, /print\s*\([^)]*\bfirst_name\b/) && has(c, /print\s*\([^)]*\blast_name\b/); },
          },
        ],
      },
      {
        id: 'q2', title: 'Area of a Circle', var: 'radius', vars: ['radius', 'area'], setup: '', init: () => ({}),
        starter: `# 1. Create a variable named radius and give it a value (for example, 20)


# 2. Create a variable named area and calculate the area of a circle:
#        area = 3.1416 * radius ** 2


# 3. Print the value of area
`,
        tasks: [
          {
            pts: 10, text: 'Create a variable named <code>radius</code> and assign it a value (for example, <code>20</code>).',
            hint: 'A number has no quotes. <code>radius = 20</code> is a number; <code>radius = "20"</code> is text, and you can’t do math with text.',
            cell: { stmt: true, asserts: ['type(radius) in (int, float)'], must: [/radius\s*=/, 'Call the variable radius.'] },
            check: c => isNum(c.value('radius')) && has(c, SETS_NUM('radius')),
          },
          {
            pts: 20, text: 'Create a variable named <code>area</code> and calculate the area of a circle with <code>area = 3.1416 * radius ** 2</code>.',
            hint: '<code>**</code> is “to the power of”: <code>radius ** 2</code> is radius squared. Press the buttons in the picture to see <code>radius * 2</code> and <code>radius ** 2</code> side by side.',
            cell: { stmt: true, asserts: ['abs(area - 3.1416 * radius ** 2) < 1e-9'], must: [/\*\*\s*2|radius\s*\*\s*radius/, 'Right idea, but square the radius: radius ** 2.'] },
            check: c => areaOK(c) && has(c, FORMULA),
          },
          {
            pts: 20, text: 'Print the value of <code>area</code>.',
            hint: 'For radius 20 Python shows 1256.6399999999999: decimals are stored approximately, so that is the right answer. Print the variable, not a number you typed.',
            check: c => printedArea(c) && has(c, /print\s*\(\s*area\s*\)/),
          },
        ],
      },
      {
        id: 'q3', title: 'Ask for the Radius', bonus: true, var: 'radius', vars: ['radius', 'area'], setup: '', init: () => ({}), ask: '20',
        starter: `# 1. Use input() to ask the user for the radius, and turn the answer into an integer:
#        radius = int(input("What is the radius? "))


# 2. Calculate the area with the same formula as before


# 3. Print the area
`,
        tasks: [
          {
            pts: 20, text: 'Use the <code>input()</code> function to ask the user for an integer value for <code>radius</code>.',
            hint: '<code>input()</code> always gives back text, even when you type a number. Wrap it in <code>int(…)</code> to turn <code>"20"</code> into <code>20</code>. The answer box next to Run is what the user types.',
            check: c => has(c, /radius\s*=\s*int\s*\(\s*input\s*\(/) && isNum(c.value('radius')),
          },
          {
            pts: 15, text: 'Calculate the area of the circle using that radius.',
            hint: 'Same line as Q2: <code>area = 3.1416 * radius ** 2</code>.',
            check: c => areaOK(c) && has(c, FORMULA),
          },
          {
            pts: 15, text: 'Print the area.',
            hint: 'Change the number in the answer box and Run again: a different radius, a different area, same script.',
            check: c => printedArea(c) && has(c, /print\s*\(\s*area\s*\)/),
          },
        ],
      },
    ],
  };
})();
