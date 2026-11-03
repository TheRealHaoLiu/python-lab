/* Lesson content: f-strings (an extra, not one of the teacher's homeworks).
   Same shape as the homework lessons. New picture: fs – {start: 'f"…"'} (app.js buildFs):
   one editable f-string, its result, and a chip per {…} showing what it evaluated to. */
(function () {
  const has = (c, re) => re.test(c.code);
  const F = [/\bf["']/, 'Right text, but write it as an f-string: f"…{…}…"'];
  // an f-string literal in the script that mentions all the given {pieces}
  const FSTR = (...pieces) => c => { const lits = c.code.match(/\bf(["'])(?:(?!\1).)*\1/g) || []; return lits.some(l => pieces.every(p => l.includes('{' + p))); };
  const RECEIPT = 'pizza'.padEnd(10) + '12.50'.padStart(8);
  const JOKE = 'A penguin walked into a library and ordered a sandwich.';

  window.LESSON = {
    id: 'fstrings',
    title: 'Extra: f-strings',
    questions: [
      {
        id: 'q1', title: 'Name Tags', var: 'name', vars: ['name', 'age', 'week', 'coins'],
        setup: "name = 'Owen'\nage = 12\nweek = 1\ncoins = 87", init: () => ({ name: 'Owen', age: 12, week: 1, coins: 87 }),
        fs: { start: 'f"Hello, {name}! Next year you will be {age + 1}."' },
        starter: `name = "Owen"
age = 12
week = 1
coins = 87

# 1. Print "Hello, <name>!" with an f-string.


# 2. Print "<name> is <age> years old." with one f-string and two braces.


# 3. Print "Next year <name> will be <age + 1>." Do the maths inside the braces.


# 4. A student writes:
#        print("Hello, {name}!")
#    What does it print? Why? Write your answer as comments below.


# 5. This line is from Homework 8:
#        print('Week %s = %s' % (week, coins))
#    Write it again as an f-string, so it prints the same thing.
`,
        tasks: [
          {
            pts: 10, text: 'Print <code>Hello, Owen!</code> with an f-string, using the <code>name</code> variable.',
            hint: 'Put <code>f</code> right before the opening quote, and the variable inside <code>{}</code>: the braces are a hole and the variable fills it.',
            cell: { expect: "'Hello, Owen!'", label: '# name is set. Type the f-string:', ph: 'f"Hello, {…}!"', must: F },
            check: c => c.printed('Hello, Owen!') && FSTR('name')(c),
          },
          {
            pts: 10, text: 'Print <code>Owen is 12 years old.</code> with one f-string and two braces.',
            hint: 'Numbers go in braces just like words. No quotes, no <code>str()</code>, no <code>%s</code>.',
            cell: { expect: "'Owen is 12 years old.'", label: '# name and age are set. Type the f-string:', ph: 'f"{…} is {…} years old."', must: F },
            check: c => c.printed('Owen is 12 years old.') && FSTR('name', 'age')(c),
          },
          {
            pts: 10, text: 'Print <code>Next year Owen will be 13.</code> Do the maths <em>inside</em> the braces.',
            hint: 'Anything Python can work out fits in a brace: <code>{age + 1}</code>. Watch the chip under the playground.',
            cell: { expect: "'Next year Owen will be 13.'", label: '# Type the f-string with age + 1 inside a brace:', ph: 'f"Next year {…} will be {… + 1}."', must: [/\{\s*age\s*\+\s*1\s*\}/, 'Right text, but do the sum inside the braces: {age + 1}.'] },
            check: c => c.printed('Next year Owen will be 13.') && has(c, /\{\s*age\s*\+\s*1\s*\}/),
          },
          {
            pts: 10, text: 'A student writes <code>print("Hello, {name}!")</code>. What does it print? Why?',
            hint: 'Run it below. Without the <code>f</code>, a brace is just a brace.',
            cell: { why: true, tryCode: 'print("Hello, {name}!")', re: /\bf\b|without|missing|no f|literal|exactly|as is|brace|curly|plain|normal|regular/i, label: '# What prints, and why?', ph: 'It prints … because …', whyHint: 'Say exactly what shows, and what is missing before the quote.', anchor: '#    What does it print? Why? Write your answer as comments below.' },
            check: c => { const n = c.notes(4); return n.length >= 15 && /\{name\}|brace|curly|exactly|as is|literal/i.test(n) && /\bf\b|without|missing|no f/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 10, text: "Rewrite <code>print('Week %s = %s' % (week, coins))</code> as an f-string that prints the same thing.",
            hint: 'Each <code>%s</code> becomes a brace with the variable in it, and the <code>% (week, coins)</code> part disappears: the names are already in place.',
            cell: { expect: "'Week 1 = 87'", label: '# week and coins are set. Type the f-string version:', ph: 'f"Week {…} = {…}"', must: F },
            check: c => c.printed('Week 1 = 87') && FSTR('week', 'coins')(c),
          },
        ],
      },
      {
        id: 'q2', title: 'The Receipt', var: 'price', vars: ['item', 'price', 'qty', 'total', 'big'],
        setup: "item = 'pizza'\nprice = 12.5\nqty = 3\ntotal = price * qty\nbig = 1234567", init: () => ({ item: 'pizza', price: { t: 'other', r: '12.5' }, qty: 3, total: { t: 'other', r: '37.5' }, big: 1234567 }),
        fs: { start: 'f"{item:<10}{price:>8.2f}  x{qty}  = {total:.2f}"' },
        starter: `item = "pizza"
price = 12.5
qty = 3
total = price * qty
big = 1234567

# 1. Print "Total: 37.50": total with exactly two decimals, using :.2f inside the brace.


# 2. Print big with thousands separators: 1,234,567 (use :, inside the brace).


# 3. Print one receipt line: item padded to 10 characters on the left, then the
#    price right-aligned in 8 characters with two decimals:  {item:<10}{price:>8.2f}


# 4. Print "PIZZA has 5 letters" by calling .upper() and len() inside the braces.


# 5. Print the debugging form {qty=} and see what it shows.
`,
        tasks: [
          {
            pts: 10, text: 'Print <code>Total: 37.50</code>: the total with exactly two decimals, using <code>:.2f</code> inside the brace.',
            hint: 'After the name, a colon starts the <em>format spec</em>. <code>.2f</code> means “a decimal number with 2 digits after the point”. Try it in the playground.',
            cell: { expect: "'Total: 37.50'", label: '# total is set (37.5). Type the f-string:', ph: 'f"Total: {total:…}"', must: [/:\s*\.2f/, 'Right text, but get the two decimals from a format spec: {total:.2f}.'] },
            check: c => c.printed('Total: 37.50') && has(c, /\{\s*total\s*:\s*\.2f\s*\}/),
          },
          {
            pts: 10, text: 'Print <code>big</code> with thousands separators: <code>1,234,567</code>.',
            hint: 'The spec is just a comma: <code>{big:,}</code>.',
            cell: { expect: "'1,234,567'", label: '# big is set. Type the f-string:', ph: 'f"{big:…}"', must: [/:\s*,/, 'Right text, but let the format spec add the commas: {big:,}.'] },
            check: c => c.printed('1,234,567') && has(c, /\{\s*big\s*:\s*,\s*\}/),
          },
          {
            pts: 15, text: 'Print one receipt line: the item padded to 10 characters on the left, then the price right-aligned in 8 characters with two decimals.',
            hint: '<code>&lt;10</code> means “left-aligned, 10 wide”, <code>&gt;8.2f</code> means “right-aligned, 8 wide, 2 decimals”. The playground starts with this very line: look at the spaces.',
            cell: { expect: "'" + RECEIPT + "'", label: '# item and price are set. Type the f-string:', ph: 'f"{item:<10}{price:>8.2f}"', must: [/[<>]\s*\d/, 'Right text, but let the format spec do the padding: <10 and >8.2f.'] },
            check: c => c.printed(RECEIPT) && has(c, /\{\s*item\s*:\s*<\s*10\s*\}/) && has(c, /\{\s*price\s*:\s*>\s*8\s*\.2f\s*\}/),
          },
          {
            pts: 10, text: 'Print <code>PIZZA has 5 letters</code> by calling <code>.upper()</code> and <code>len()</code> inside the braces.',
            hint: 'Braces hold any expression: <code>{item.upper()}</code>, <code>{len(item)}</code>.',
            cell: { expect: "'PIZZA has 5 letters'", label: '# item is set. Type the f-string:', ph: 'f"{item.…} has {len(…)} letters"', must: [/\.upper\(\)|len\(/, 'Right text, but do the work inside the braces: item.upper() and len(item).'] },
            check: c => c.printed('PIZZA has 5 letters') && has(c, /\{\s*item\s*\.\s*upper\s*\(\s*\)\s*\}/) && has(c, /\{\s*len\s*\(\s*item\s*\)\s*\}/),
          },
          {
            pts: 5, text: 'Print the debugging form <code>{qty=}</code> and see what it shows.',
            hint: 'An <code>=</code> right after the name prints the name, the equals sign and the value: handy when hunting a bug.',
            cell: { expect: "'qty=3'", label: '# Type the f-string with {qty=}:', ph: 'f"{qty=}"', must: [/\{\s*qty\s*=\s*\}/, 'Right text, but use the = form: {qty=}.'] },
            check: c => c.printed('qty=3') && has(c, /\{\s*qty\s*=\s*\}/),
          },
        ],
      },
      {
        id: 'q3', title: 'Three Ways, One Sentence', bonus: true, var: 'who', vars: ['who', 'where'],
        setup: "who = 'A penguin'\nwhere = 'library'", init: () => ({ who: 'A penguin', where: 'library' }),
        fs: { start: 'f"{who} walked into a {where} and ordered a sandwich."' },
        starter: `who = "A penguin"
where = "library"

# 1. Print the joke three times, once each way, so the three lines are identical:
#    with %s and %, with {} and .format(), and with an f-string.


# 2. Which of the three do you like best, and why? Write your answer as comments below.
`,
        tasks: [
          {
            pts: 6, text: 'Print the joke three times, once each way: <code>%s</code> and <code>%</code>, <code>{}</code> and <code>.format()</code>, and an f-string. The three lines must be identical.',
            hint: 'Same sentence, three spellings. Homework 3 has the first two; the playground above has the third.',
            check: c => c.outputs.filter(l => l === JOKE).length >= 3 && has(c, /%\s*\(\s*who\s*,\s*where\s*\)/) && has(c, /\.format\s*\(\s*who\s*,\s*where\s*\)/) && FSTR('who', 'where')(c),
          },
          {
            pts: 4, text: 'Which of the three do you like best, and why?',
            hint: 'There is no wrong answer, but say what makes it easier for you: shorter, easier to read, harder to get wrong?',
            cell: { why: true, re: /.{15,}/, label: '# Which one, and why?', ph: 'I like … because …', whyHint: 'Name one of the three and give a reason.' },
            check: c => { const n = c.notes(2); return n.length >= 15 && /f-string|f string|fstring|format|%s|percent/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
        ],
      },
    ],
  };
})();
