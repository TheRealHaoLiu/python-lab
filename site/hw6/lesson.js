/* Lesson content: Dictionaries.
   Each question has the variable(s) shown in the picture, the setup lines, a starter
   homework.py, and tasks.
     var    – the main variable; vars: ['a', 'b'] when the picture shows more than one
              (then init() returns {a: value, b: value}, and the page has data-row="q2:b")
     syncPicture – after Run, redraw the picture from what the script left behind
   A task has:
     pts, text (HTML), hint (HTML, optional)
     cell   – the assert practice box:
              {expect: '<python literal>'}             student types an expression
              {stmt: true, asserts: ['<python expr>']} student types a statement
              {why: true, tryCode: '<python>'}         written explanation
                 ok: regex   makes it a guess instead (checked against the regex);
                 label, ph, rows, okMsg, whyHint, anchor (starter line to add it under)
              must: [regex, message]  extra rule on what they typed
     check(c) – grades homework.py. c.printed(text), c.printedAny([...]),
              c.code (script without comments), c.dict(name), c.list(name), c.explained()
*/
(function () {
  const PETS = "{'Maya': 'hamster', 'Leo': 'goldfish', 'Ava': 'cat', 'Noah': 'turtle', 'Zoe': 'parrot'}";
  const BOOKS = "['Harry Potter', 'Charlotte\\'s Web', 'The Hobbit']";
  const STICKERS = "{'dragon': 4, 'unicorn': 2, 'rocket': 7}";
  const SPORTS = "{'Ralph': 'Football', 'Rebecca': 'Netball'}", COLORS = "{'Malcolm': 'Pink', 'Sue': 'Purple'}";
  const TEAMS = "{'red': ['Maya', 'Leo'], 'blue': ['Sam', 'Ava', 'Noah']}";
  const has = (c, re) => re.test(c.code);
  // name['key'] or name.get('key')
  const LOOK = (v, k) => new RegExp(`${v}\\s*(\\[\\s*(['"])${k}\\2\\s*\\]|\\.\\s*get\\s*\\(\\s*(['"])${k}\\3)`);
  // name['key'] = ...
  const SET = (v, k) => new RegExp(`${v}\\s*\\[\\s*(['"])${k}\\1\\s*\\]\\s*=[^=]`);
  const LEN = [/len\s*\(/, 'Right value, but the task asks you to use len().'];
  const L = items => ({ t: 'list', items }), D = pairs => ({ t: 'dict', items: pairs });

  window.LESSON = {
    id: 'hw6',
    title: 'Homework 6: Dictionaries',
    questions: [
      {
        id: 'q1', title: 'Class Pet Registry', var: 'class_pets', setup: 'class_pets = ' + PETS, syncPicture: true,
        init: () => D([['Maya', 'hamster'], ['Leo', 'goldfish'], ['Ava', 'cat'], ['Noah', 'turtle'], ['Zoe', 'parrot']]),
        starter: `class_pets = {
    'Maya': 'hamster',
    'Leo': 'goldfish',
    'Ava': 'cat',
    'Noah': 'turtle',
    'Zoe': 'parrot'
}

# 1. Print the whole dictionary using print(class_pets)


# 2. Print Maya's pet by looking up the key 'Maya'


# 3. Ava gets a new pet: change Ava's value from 'cat' to 'rabbit' using the key


# 4. Add a new student, 'Sam', whose pet is 'dog'


# 5. Noah moves away, so remove Noah's entry using del


# 6. Use len(class_pets) to print how many students are in the dictionary now
`,
        tasks: [
          { pts: 5, text: 'Print the whole dictionary using <code>print(class_pets)</code>.', cell: { expect: PETS }, check: c => c.printed(PETS) },
          { pts: 10, text: "Print Maya's pet by looking up the key <code>'Maya'</code>.", hint: 'A dictionary is looked up by key, not by position: the key goes inside the square brackets.', cell: { expect: "'hamster'", must: [LOOK('class_pets', 'Maya'), "Right value, but the task asks you to look up the key 'Maya'."] }, check: c => c.printed('hamster') && has(c, LOOK('class_pets', 'Maya')) },
          { pts: 10, text: "Ava gets a new pet: change Ava's value from <code>'cat'</code> to <code>'rabbit'</code> using the key.", hint: 'Giving a key that is already there a new value replaces the old one. Try the Leo button in the picture.', cell: { stmt: true, asserts: ["class_pets['Ava'] == 'rabbit'", 'len(class_pets) == 5'], must: [/\]\s*=[^=]/, "Change it with the key: class_pets['Ava'] = ..."] }, check: c => { const d = c.dict('class_pets'); return !!d && d.Ava === 'rabbit' && has(c, SET('class_pets', 'Ava')); } },
          { pts: 10, text: "Add a new student, <code>'Sam'</code>, whose pet is <code>'dog'</code>.", hint: 'Giving a value to a key that isn’t there yet adds a new entry at the end. Try the Kai button in the picture.', cell: { stmt: true, asserts: ["class_pets['Sam'] == 'dog'", 'len(class_pets) == 6'], must: [/\]\s*=[^=]/, "Add it with a new key: class_pets['Sam'] = ..."] }, check: c => { const d = c.dict('class_pets'); return !!d && d.Sam === 'dog' && has(c, SET('class_pets', 'Sam')); } },
          { pts: 10, text: "Noah moves away, so remove Noah's entry using <code>del</code>.", hint: '<code>del</code> works with a key the same way it worked with an index on a list.', cell: { stmt: true, asserts: ["'Noah' not in class_pets", 'len(class_pets) == 5'], must: [/\bdel\b/, 'Use del for this one.'] }, check: c => { const d = c.dict('class_pets'); return !!d && !('Noah' in d) && has(c, /\bdel\s+class_pets\s*\[/); } },
          { pts: 5, text: 'Use <code>len(class_pets)</code> to print how many students are in the dictionary now.', cell: { expect: '5', must: LEN }, check: c => c.printed('5') && has(c, /len\s*\(\s*class_pets\s*\)/) },
        ],
      },
      {
        id: 'q2', title: 'Book Shelf vs. Sticker Album', var: 'books', vars: ['books', 'stickers'], syncPicture: true,
        setup: [`books = ${BOOKS}`, `stickers = ${STICKERS}`, `sports = ${SPORTS}`, `colors = ${COLORS}`].join('\n'),
        init: () => ({ books: L(['Harry Potter', "Charlotte's Web", 'The Hobbit']), stickers: D([['dragon', 4], ['unicorn', 2], ['rocket', 7]]) }),
        starter: `books = ${BOOKS}
stickers = ${STICKERS}

# 1. Print the first book in the list using index 0


# 2. Print how many 'rocket' stickers there are by looking up the key 'rocket'


# 3. Add the book 'Matilda' to the end of the books list using .append()


# 4. Add a new sticker, 'star', with a count of 3 to the stickers dictionary


# 5. Remove 'unicorn' from the stickers dictionary using del


# 6. A student tries to join two dictionaries with +:
#        sports = ${SPORTS}
#        colors = ${COLORS}
#        print(sports + colors)
#    What happens? Why? Write your answer as comments below.
`,
        tasks: [
          { pts: 5, text: 'Print the first book in the list using index <code>0</code>.', cell: { expect: "'Harry Potter'", must: [/\[\s*0\s*\]/, 'Right value, but the task asks for index 0.'] }, check: c => c.printed('Harry Potter') && has(c, /books\s*\[\s*0\s*\]/) },
          { pts: 10, text: "Print how many <code>'rocket'</code> stickers there are by looking up the key <code>'rocket'</code>.", cell: { expect: '7', must: [LOOK('stickers', 'rocket'), "Right value, but the task asks you to look up the key 'rocket'."] }, check: c => c.printed('7') && has(c, LOOK('stickers', 'rocket')) },
          { pts: 5, text: "Add the book <code>'Matilda'</code> to the end of the books list using <code>.append()</code>.", cell: { stmt: true, asserts: ["books[-1] == 'Matilda'", 'len(books) == 4'], must: [/\.append\s*\(/, 'Use .append() for this one.'] }, check: c => { const b = c.list('books'); return !!b && b.includes('Matilda') && has(c, /books\s*\.\s*append\s*\(/); } },
          { pts: 10, text: "Add a new sticker, <code>'star'</code>, with a count of <code>3</code> to the stickers dictionary.", hint: 'A dictionary has no <code>.append()</code>, because it has no positions. Give a new key a value instead, like you did in Q1.', cell: { stmt: true, asserts: ["stickers['star'] == 3", 'len(stickers) == 4'] }, check: c => { const d = c.dict('stickers'); return !!d && d.star === 3; } },
          { pts: 10, text: "Remove <code>'unicorn'</code> from the stickers dictionary using <code>del</code>.", cell: { stmt: true, asserts: ["'unicorn' not in stickers", 'len(stickers) == 3'], must: [/\bdel\b/, 'Use del for this one.'] }, check: c => { const d = c.dict('stickers'); return !!d && !('unicorn' in d) && has(c, /\bdel\s+stickers\s*\[/); } },
          { pts: 15, text: `A student tries to join two dictionaries with <code>+</code>: <code>sports = ${SPORTS}</code>, <code>colors = ${COLORS}</code>, then <code>print(sports + colors)</code>. What happens? Why? Answer in comments (lines starting with <code>#</code>).`, hint: 'Run the line below to see what Python says. Then explain it in your own words.', cell: { why: true, tryCode: 'print(sports + colors)', whyHint: 'Say what Python does (the error) and why + doesn’t work on two dictionaries.' }, check: c => c.explained(), doneLabel: 'answered (teacher grades this one)' },
        ],
      },
      {
        id: 'q3', title: 'Team Rosters', bonus: true, var: 'teams', setup: 'teams = ' + TEAMS, syncPicture: true,
        init: () => D([['red', L(['Maya', 'Leo'])], ['blue', L(['Sam', 'Ava', 'Noah'])]]),
        starter: `teams = {
    'red': ['Maya', 'Leo'],
    'blue': ['Sam', 'Ava', 'Noah']
}

# 1. What does print(teams['blue'][0]) display? Write your guess as a comment, then print it.


# 2. Write one line of code to add 'Zoe' to the 'red' team
`,
        tasks: [
          { pts: 5, text: "What does <code>print(teams['blue'][0])</code> display? Guess first, then print it in homework.py to check.", hint: "<code>teams['blue']</code> is a whole list. The <code>[0]</code> after it picks from that list.", cell: { why: true, ok: /\bsam\b/i, tryCode: "print(teams['blue'][0])", label: '# Your guess: what will it display?', ph: 'I think it shows…', rows: 1, okMsg: '✓ right! Now print it in homework.py.', whyHint: "Not yet. Find the 'blue' team first, then the name at index 0 of its list.", anchor: "# 1. What does print(teams['blue'][0]) display? Write your guess as a comment, then print it." }, check: c => c.printed('Sam') && has(c, /teams\s*\[\s*(['"])blue\1\s*\]\s*\[\s*0\s*\]/) },
          { pts: 5, text: "Write one line of code to add <code>'Zoe'</code> to the <code>'red'</code> team.", hint: "<code>teams['red']</code> is a list, so anything that adds to a list works on it.", cell: { stmt: true, asserts: ["teams['red'] == ['Maya', 'Leo', 'Zoe']", "teams['blue'] == ['Sam', 'Ava', 'Noah']"], must: [/teams\s*\[\s*(['"])red\1\s*\]/, "Reach the red team's list through teams['red']."] }, check: c => { const d = c.dict('teams'); return !!d && !!d.red && Array.isArray(d.red.items) && d.red.items.includes('Zoe') && has(c, /teams\s*\[\s*(['"])red\1\s*\]/); } },
        ],
      },
    ],
  };
})();
