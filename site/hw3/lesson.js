/* Lesson content: strings with slots (Homework 3): %s and %, {} and .format(), f-strings.
   Same shape as hw5/lesson.js, plus:
     fmt – the picture: {templates: [names of %s strings], values: {name: [literals]},
           names: {name: [variable names the f-string version shows]}}  (app.js buildFmt)
   Points are the page's own: the posting gives none per task. */
(function () {
  const has = (c, re) => re.test(c.code);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // the string literal assigned to `name` in the script (first one), as text
  const literalOf = (c, name) => { const m = new RegExp(`^\\s*${name}\\s*=\\s*(?:f)?(["'])((?:(?!\\1).)*)\\1\\s*$`, 'm').exec(c.code); return m ? m[2] : null; };
  const slots = (t, mark) => (t.match(mark === '{}' ? /\{\}/g : /%s/g) || []).length;
  // the printed lines that fit a template with its slots as wildcards; distinct ones
  const fits = (c, t, mark, outputs) => { const re = new RegExp('^' + t.split(mark).map(esc).join('(.+)') + '$'); return [...new Set(outputs.filter(l => re.test(l) && !l.includes(mark)))]; };
  const JOKE = '%s walked into a %s and ordered a sandwich.';
  const SETUP1 = [
    'color = "blue"', 'sentence = "My favorite color is ____"',
    'vehicle_text = "%s: a vehicle for traveling to %s"', 'thing1 = "Rocket"', 'thing2 = "Mars"',
    'animal_joke = "What did the %s say to the %s? Let\'s be friends!"',
    'score_text = "Player %s scored %s points"',
  ].join('\n');

  window.LESSON = {
    id: 'hw3',
    title: 'Homework 3: Strings with Slots',
    questions: [
      {
        id: 'q1', title: 'Fill in the Blanks, Mad Libs Style', var: 'vehicle_text', vars: ['vehicle_text', 'thing1', 'thing2', 'color', 'sentence', 'animal_joke', 'score_text'],
        setup: SETUP1,
        init: () => ({ vehicle_text: '%s: a vehicle for traveling to %s', thing1: 'Rocket', thing2: 'Mars', color: 'blue', sentence: 'My favorite color is ____', animal_joke: "What did the %s say to the %s? Let's be friends!", score_text: 'Player %s scored %s points' }),
        fmt: {
          templates: ['vehicle_text', 'animal_joke', 'score_text'],
          values: { vehicle_text: ["'Rocket'", "'Mars'"], animal_joke: ["'cat'", "'dog'"], score_text: ['7', '42'] },
          names: { vehicle_text: ['thing1', 'thing2'], animal_joke: ['animal1', 'animal2'], score_text: ['player', 'points'] },
        },
        starter: `# --- Part A ---
# Expected output: "My favorite color is blue"
color = "blue"
sentence = "My favorite color is ____"
print(sentence % color)

# --- Part B ---
# Expected output: "Rocket: a vehicle for traveling to Mars"
vehicle_text = "%s: a vehicle for traveling to %s"
thing1 = "Rocket"
thing2 = "Mars"
print(vehicle_text % (____, ____))

# --- Part C ---
# Expected output: "What did the cat say to the dog? Let's be friends!"
animal_joke = "What did the %s say to the %s? Let's be friends!"
print(animal_joke % (____, ____))

# --- Part D ---
# Expected output: "Player 7 scored 42 points"
score_text = "Player %s scored %s points"
print(score_text % (____, ____))

# --- Challenge ---
# Add one more line that uses the same score_text with different numbers
# (for example, Player 3 scored 99 points).
`,
        tasks: [
          {
            pts: 10, text: 'Part A: fix <code>sentence</code> so that <code>print(sentence % color)</code> prints <code>My favorite color is blue</code>.',
            hint: 'The blank <code>____</code> is where the slot goes. A slot is written <code>%s</code>: it is a marker for a value that arrives later.',
            cell: { stmt: true, asserts: ["sentence % color == 'My favorite color is blue'"], must: [/sentence\s*=/, 'Change the sentence variable: sentence = "…"'] },
            check: c => c.printed('My favorite color is blue') && has(c, /sentence\s*%\s*color/) && /%s/.test(literalOf(c, 'sentence') || ''),
          },
          {
            pts: 10, text: 'Part B: fill the blanks so it prints <code>Rocket: a vehicle for traveling to Mars</code>. Use the two variables.',
            hint: 'Two slots, two values, in order: the first value goes into the first <code>%s</code>. Try it in the picture with <code>vehicle_text</code>.',
            cell: { expect: "'Rocket: a vehicle for traveling to Mars'", must: [/thing1/, 'Right text, but use the variables: (thing1, thing2).'] },
            check: c => c.printed('Rocket: a vehicle for traveling to Mars') && has(c, /vehicle_text\s*%\s*\(\s*thing1\s*,\s*thing2\s*\)/),
          },
          {
            pts: 10, text: "Part C: fill the blanks so it prints <code>What did the cat say to the dog? Let's be friends!</code>",
            hint: 'There are no variables for these, so put the words in as strings, with quotes. Try <code>animal_joke</code> in the picture.',
            cell: { expect: "\"What did the cat say to the dog? Let's be friends!\"", must: [/animal_joke\s*%/, 'Right text, but fill the slots of animal_joke with %.'] },
            check: c => c.printed("What did the cat say to the dog? Let's be friends!") && has(c, /animal_joke\s*%\s*\(/),
          },
          {
            pts: 10, text: 'Part D: fill the blanks so it prints <code>Player 7 scored 42 points</code>.',
            hint: 'Numbers go in without quotes. <code>%s</code> turns anything into text.',
            cell: { expect: "'Player 7 scored 42 points'", must: [/score_text\s*%/, 'Right text, but fill the slots of score_text with %.'] },
            check: c => c.printed('Player 7 scored 42 points') && has(c, /score_text\s*%\s*\(/),
          },
          {
            pts: 10, text: 'Challenge: add one more line that uses the same <code>score_text</code> with different numbers, for example <code>Player 3 scored 99 points</code>.',
            hint: 'One template, many sentences: that is the point of a slot. Reuse <code>score_text</code>, change only the numbers.',
            check: c => (c.code.match(/score_text\s*%/g) || []).length >= 2 && c.outputs.some(l => /^Player \S+ scored \S+ points$/.test(l) && l !== 'Player 7 scored 42 points'),
          },
        ],
      },
      {
        id: 'q2', title: 'Build Your Own Joke Generator', var: 'joke', setup: `joke = "${JOKE}"`, init: () => JOKE,
        fmt: { templates: ['joke'], values: { joke: ["'A penguin'", "'library'"] }, names: { joke: ['who', 'where'] } },
        starter: `# Step 1: Create the joke template (a string with two %s slots)
joke = "${JOKE}"

# Step 2: Create your variable pairs: three pairs, six variables in all
#    (for example who1 = "A penguin" and where1 = "library")


# Step 3: Print the joke three times, once per pair
`,
        tasks: [
          {
            pts: 10, text: 'Store a joke template string containing two <code>%s</code> slots in the variable <code>joke</code>. Keep the one given, or write your own.',
            hint: 'Count the <code>%s</code> in your string: exactly two. Type the line below and press Check.',
            cell: { stmt: true, asserts: ["joke.count('%s') == 2"], must: [/joke\s*=/, 'Assign it to joke: joke = "…"'] },
            check: c => { const t = literalOf(c, 'joke'); return !!t && slots(t, '%s') === 2; },
          },
          {
            pts: 20, text: 'Store three pairs of variables (six variables in all) to plug into the joke.',
            hint: 'Each pair is two strings: who walked in, and where. Six lines like <code>who1 = "A robot"</code>. Names are up to you.',
            check: c => { const m = c.code.match(/^\s*(?!joke\b)\w+\s*=\s*(["'])(?:(?!\1).)*\1\s*$/gm) || []; return m.length >= 6; },
          },
          {
            pts: 20, text: 'Print the joke three times, once per pair, using <code>joke % (…, …)</code> each time.',
            hint: 'Three print lines. Each one fills the same <code>joke</code> with a different pair. The picture shows one pair at a time; your script does three.',
            check: c => { const t = literalOf(c, 'joke'); return !!t && slots(t, '%s') === 2 && (c.code.match(/joke\s*%\s*\(/g) || []).length >= 3 && fits(c, t, '%s', c.outputs).length >= 3; },
          },
        ],
      },
      {
        id: 'q3', title: 'Three Ways to Fill a Slot', bonus: true, var: 'joke', setup: `joke = "${JOKE}"`, init: () => JOKE,
        fmt: { templates: ['joke'], values: { joke: ["'A pirate'", "'spaceship'"] }, names: { joke: ['who', 'where'] } },
        starter: `# 1. Rewrite your joke generator with {} slots and .format() instead of %s and %.
#    Print it three times again.


# 2. What changes when you use {} and .format() instead of %s and %?
#    Write your answer as comments below.


# 3. Extra (not in the posted homework): write the joke once more as an
#    f-string: put f before the quotes and the variable names inside {}.
#    Print it three times again.
`,
        tasks: [
          {
            pts: 10, text: 'Rewrite your joke generator using <code>{}</code> placeholders and <code>.format()</code> instead of <code>%s</code>. Print it three times.',
            hint: 'Switch the picture to <em>{} and .format()</em>: the slots become <code>{}</code>, and the values go in <code>.format(…)</code> after the string.',
            cell: { stmt: true, asserts: ["joke.count('{}') == 2", "'%s' not in joke"], must: [/joke\s*=/, 'Assign it to joke: joke = "…"'] },
            check: c => { const t = literalOf(c, 'joke'); if (!t || slots(t, '{}') !== 2) return false; return (c.code.match(/\.format\s*\(/g) || []).length >= 3 && fits(c, t, '{}', c.outputs).length >= 3; },
          },
          {
            pts: 5, text: 'What changes when you use <code>{}</code> and <code>.format()</code> instead of <code>%s</code> and <code>%</code>? Answer in comments.',
            hint: 'Compare the two code lines in the picture: where do the values go, and what marks a slot?',
            cell: { why: true, re: /format|\{\}|curly|brace|dot|method|percent|%|parenthes|same|instead|after/, ph: 'With {} the values go…', whyHint: 'Say what marks the slot and where the values go in each version.' },
            check: c => { const n = c.notes(2); return n.length >= 15 && /format|\{\}|curly|brace|dot|method|percent|%|parenthes|same|instead|after/i.test(n); }, doneLabel: 'answered (teacher grades this one)',
          },
          {
            pts: 5, text: 'Extra: write the joke once more as an <strong>f-string</strong>: <code>f"…{who}…{where}…"</code>, with the variable names inside the braces. Print it three times.',
            hint: 'Switch the picture to <em>f-string</em>. The slots hold the variable names themselves, so nothing has to be counted or matched up. This is how most Python is written today.',
            check: c => { const fs = c.code.match(/\bf(["'])(?:(?!\1).)*\{\w+\}(?:(?!\1).)*\{\w+\}(?:(?!\1).)*\1/g) || []; if (!fs.length) return false; const t = fs[0].slice(2, -1).replace(/\{\w+\}/g, '%s'); return fits(c, t, '%s', c.outputs).length >= 3; },
          },
        ],
      },
    ],
  };
})();
