/* Lesson content: Lists (Homework 4). Same shape as hw5/lesson.js (see its header for the
   task and cell formats). Points are the page's own: the posting gives none per task. */
(function () {
  const P0 = "['dragon scale', 'unicorn hair', 'phoenix feather', 'moonstone', 'toadstool', 'crystal shard']";
  const P1 = "['dragon scale', 'unicorn hair', 'phoenix feather', 'star dust', 'toadstool', 'crystal shard']";
  const B0 = "['notebook', 3, 'pencil', 'apple', 12, 'water bottle', 'map']";
  const B1 = "['notebook', 3, 'pencil', 'sandwich', 12, 'water bottle', 'map']";
  const has = (c, re) => re.test(c.code);
  const NEG = [/\[\s*-/, 'Right value, but the task asks for a negative index.'];
  const SLICE = [/:/, 'Right value, but the task asks for a slice: [start:stop].'];
  const LEN = [/len\s*\(/, 'Right value, but the task asks you to use len().'];
  const L = items => ({ t: 'list', items });
  // values as the worker sends them: ints and strings plain, floats as {t: 'other', r: '3.5'}
  const isStr = v => typeof v === 'string', isNum = v => typeof v === 'number' || (!!v && v.t === 'other' && /^-?\d/.test(v.r));
  const str = v => v && v.t === 'other' ? v.r : String(v);
  const lit = v => isStr(v) ? (v.includes("'") ? JSON.stringify(v) : `'${v}'`) : str(v);

  window.LESSON = {
    id: 'hw4',
    title: 'Homework 4: Lists',
    questions: [
      {
        id: 'q1', title: 'Magical Potion Ingredients', var: 'potions', setup: 'potions = ' + P0, syncPicture: true,
        init: () => L(['dragon scale', 'unicorn hair', 'phoenix feather', 'moonstone', 'toadstool', 'crystal shard']),
        starter: `potions = ${P0}

# 1. Print the whole list using print(potions)


# 2. Print just the third ingredient (remember: Python starts counting at 0!)


# 3. Change 'moonstone' to 'star dust' using indexing


# 4. Print a slice of the list showing the first three ingredients


# 5. Print the last ingredient using negative indexing (hint: potions[-1])
`,
        tasks: [
          { pts: 10, text: 'Print the whole list using <code>print(potions)</code>.', cell: { expect: P0 }, check: c => c.printed(P0) },
          { pts: 10, text: 'Print just the third ingredient. Remember: Python starts counting at 0!', hint: 'Count the index numbers above the boxes: the first box is 0, so the third is 2.', cell: { expect: "'phoenix feather'" }, check: c => c.printed('phoenix feather') && has(c, /potions\s*\[\s*(2|-\s*4)\s*\]/) },
          { pts: 10, text: "Change <code>'moonstone'</code> to <code>'star dust'</code> using indexing.", hint: "Find the index of 'moonstone' in the picture, then write <code>potions[?] = 'star dust'</code>. Nothing prints; the box changes.", cell: { stmt: true, asserts: ['potions == ' + P1], must: [/\]\s*=[^=]/, "Change it with indexing: potions[?] = 'star dust'."] }, check: c => c.final(o => o.includes('star dust') && !o.includes('moonstone')) && has(c, /potions\s*\[[^\]]+\]\s*=[^=]/) },
          { pts: 10, text: 'Print a slice of the list showing the first three ingredients.', hint: 'A slice <code>[start:stop]</code> stops <em>before</em> the stop index. Use the slice explorer to find the right numbers.', cell: { expect: "['dragon scale', 'unicorn hair', 'phoenix feather']", must: SLICE }, check: c => c.printed("['dragon scale', 'unicorn hair', 'phoenix feather']") && has(c, /potions\s*\[[^\]]*:[^\]]*\]/) },
          { pts: 10, text: 'Print the last ingredient using negative indexing (hint: <code>potions[-1]</code>).', hint: 'Switch the picture to count from the back: the last box is -1.', cell: { expect: "'crystal shard'", must: NEG }, check: c => c.printed('crystal shard') && has(c, /potions\s*\[\s*-\s*1\s*\]/) },
        ],
      },
      {
        id: 'q2', title: 'Mixed Up Backpack', var: 'backpack', setup: 'backpack = ' + B0, syncPicture: true,
        init: () => L(['notebook', 3, 'pencil', 'apple', 12, 'water bottle', 'map']),
        starter: `backpack = ${B0}

# 1. Print the entire backpack list


# 2. Print only the numbers, using their index positions (they are at indexes 1 and 4)


# 3. Print a slice from index 2 to index 5


# 4. Replace 'apple' with 'sandwich'


# 5. Print the length of your list using len(backpack)
`,
        tasks: [
          { pts: 10, text: 'Print the entire backpack list.', cell: { expect: B0 }, check: c => c.printed(B0) },
          { pts: 10, text: 'Print only the numbers, using their index positions (hint: they are at indexes 1 and 4).', hint: 'Two prints, or one print with both: <code>print(backpack[1], backpack[4])</code>. Click the number boxes in the picture to see their indexes.', cell: { expect: '3', label: '# The first number, taken from the list by its index:', ph: 'backpack[…]', must: [/backpack\s*\[\s*1\s*\]/, 'Right value, but get it from the list: backpack[1].'] }, check: c => c.printedAny(['3', '3 12', '3, 12', '[3, 12]']) && c.printedAny(['12', '3 12', '3, 12', '[3, 12]']) && has(c, /backpack\s*\[\s*1\s*\]/) && has(c, /backpack\s*\[\s*4\s*\]/) },
          { pts: 10, text: 'Print a slice from index 2 to index 5.', hint: 'In Python “from 2 to 5” is written <code>backpack[2:5]</code>, and the stop index is not included. Check it with the picture.', cell: { expect: "['pencil', 'apple', 12]", must: SLICE }, check: c => c.printedAny(["['pencil', 'apple', 12]", "['pencil', 'apple', 12, 'water bottle']"]) && has(c, /backpack\s*\[\s*2\s*:\s*[56]\s*\]/) },
          { pts: 10, text: "Replace <code>'apple'</code> with <code>'sandwich'</code>.", hint: "Which index holds 'apple'? Then <code>backpack[?] = 'sandwich'</code>.", cell: { stmt: true, asserts: ['backpack == ' + B1], must: [/\]\s*=[^=]/, "Change it with indexing: backpack[?] = 'sandwich'."] }, check: c => c.final(o => o.includes('sandwich') && !o.includes('apple')) && has(c, /backpack\s*\[[^\]]+\]\s*=[^=]/) },
          { pts: 10, text: 'Print the length of your list using <code>len(backpack)</code>.', cell: { expect: '7', must: LEN }, check: c => c.printed('7') && has(c, /len\s*\(\s*backpack\s*\)/) },
        ],
      },
      {
        id: 'q3', title: 'Bonus Challenges', bonus: true, var: 'potions', vars: ['potions', 'my_favorites'], syncPicture: true,
        setup: `potions = ${P0}\nmy_favorites = []`,
        init: () => ({ potions: L(['dragon scale', 'unicorn hair', 'phoenix feather', 'moonstone', 'toadstool', 'crystal shard']), my_favorites: L([]) }),
        starter: `potions = ${P0}

# 1. Add 'wizard tears' to the end of potions using .append(), then print potions


# 2. Create your own list called my_favorites with at least 5 items.
#    Mix strings and numbers!


# 3. Print the first item of my_favorites


# 4. Print the last item of my_favorites


# 5. Print the middle three items of my_favorites using a slice
`,
        tasks: [
          { pts: 4, text: "Add <code>'wizard tears'</code> to the end of <code>potions</code> using <code>.append()</code>, then print the list.", hint: '<code>.append()</code> adds one item after the last box. Press the append button in the picture.', cell: { stmt: true, asserts: ["potions[-1] == 'wizard tears'", 'len(potions) == 7'], must: [/\.append\s*\(/, 'Use .append() for this one.'] }, check: c => { const p = c.list('potions'); return !!p && p[p.length - 1] === 'wizard tears' && has(c, /potions\s*\.\s*append\s*\(/) && c.printed(P0.slice(0, -1) + ", 'wizard tears']"); } },
          { pts: 4, text: 'Create your own list called <code>my_favorites</code> with at least 5 items. Mix strings and numbers!', hint: 'Strings have quotes, numbers don’t: <code>my_favorites = [\'pizza\', 7, …]</code>. After Run, the picture shows your list.', cell: { stmt: true, asserts: ['len(my_favorites) >= 5', 'any(type(x) == str for x in my_favorites)', 'any(type(x) in (int, float) for x in my_favorites)'] }, check: c => { const f = c.list('my_favorites'); return !!f && f.length >= 5 && f.some(isStr) && f.some(isNum); } },
          { pts: 4, text: 'Print the first item of <code>my_favorites</code>.', hint: 'Index 0. The check box can’t know your list, so this one is graded from homework.py only.', check: c => { const f = c.list('my_favorites'); return !!f && f.length >= 5 && c.printed(str(f[0])) && has(c, /my_favorites\s*\[\s*0\s*\]/); } },
          { pts: 4, text: 'Print the last item of <code>my_favorites</code>.', hint: 'Negative indexing works on your list too: <code>[-1]</code>.', check: c => { const f = c.list('my_favorites'); return !!f && f.length >= 5 && c.printed(str(f[f.length - 1])) && has(c, /my_favorites\s*\[\s*-\s*1\s*\]/); } },
          { pts: 4, text: 'Print the middle three items of <code>my_favorites</code> using a slice.', hint: 'With 5 items the middle three are indexes 1, 2 and 3: a slice that starts at 1 and stops before 4.', check: c => { const f = c.list('my_favorites'); if (!f || f.length < 5) return false; const m = Math.floor((f.length - 3) / 2); const want = '[' + f.slice(m, m + 3).map(lit).join(', ') + ']'; return c.printed(want) && has(c, /my_favorites\s*\[[^\]]*:[^\]]*\]/); } },
        ],
      },
    ],
  };
})();
