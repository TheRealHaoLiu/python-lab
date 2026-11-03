/* Playground page: the four tabs, and the Reference list built from window.TURTLE_REF.
   Runs after app.js, so the pictures (S, LESSON) already exist. */
'use strict';
(function () {
  const TABS = ['overview', 'demo', 'games', 'playground', 'reference'];
  const bar = document.querySelector('[data-tabs]');
  const panels = Object.fromEntries(TABS.map(t => [t, document.querySelector(`[data-panel="${t}"]`)]));
  function show(tab, push = true) {
    if (!panels[tab]) tab = 'overview';
    for (const t of TABS) { panels[t].hidden = t !== tab; bar.querySelector(`[data-tab="${t}"]`).setAttribute('aria-selected', String(t === tab)); }
    if (push && location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab);
    // the page stays where it is: switching tabs must not jump to the top
  }
  bar.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) show(b.dataset.tab); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-goto]'); if (a) { e.preventDefault(); show(a.dataset.goto); return; }
    const g = e.target.closest('a.gm-card'); if (g) { e.preventDefault(); const sec = document.querySelector(g.getAttribute('href')); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
  window.addEventListener('hashchange', () => show(location.hash.slice(1), false));
  show(location.hash.slice(1) || 'overview', false);

  /* ---------- playground: prompt or script ---------- */
  const pgBtns = document.querySelectorAll('[data-pgmode]');
  function pgMode(m) {
    document.querySelectorAll('[data-pg]').forEach(el => { el.hidden = el.dataset.pg !== m; });
    pgBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pgmode === m)));
    try { localStorage.setItem('pylab:turtle-play:pgmode', m); } catch (e) { /* private mode */ }
  }
  pgBtns.forEach(b => b.addEventListener('click', () => pgMode(b.dataset.pgmode)));
  let saved = null; try { saved = localStorage.getItem('pylab:turtle-play:pgmode'); } catch (e) { /* ignore */ }
  pgMode(saved === 'script' ? 'script' : 'repl');

  /* ---------- the reference list ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const list = document.querySelector('[data-ref-list]');
  const REF = window.TURTLE_REF || [];
  let k = 0;
  list.innerHTML = REF.map(g => `<h3 class="ref-group" id="ref-${g.group.toLowerCase().replace(/[^a-z]+/g, '-')}">${esc(g.group)}</h3>` + g.items.map(r => `
    <article class="ref-card" data-ref="${k++}">
      <div class="ref-head"><code class="ref-sig">${esc(r.sig)}</code>${r.alias ? `<span class="ref-alias">also ${esc(r.alias)}</span>` : ''}<button type="button" class="btn ref-try" data-try="${k - 1}">▶ Try it</button></div>
      <p class="ref-desc">${esc(r.desc)}</p>
      <pre class="ref-code">${typeof hl === 'function' ? hl(r.code) : esc(r.code)}</pre>
    </article>`).join('')).join('');
  const toc = document.querySelector('[data-ref-toc]');
  if (toc) toc.innerHTML = REF.map(g => `<a href="#ref-${g.group.toLowerCase().replace(/[^a-z]+/g, '-')}" data-toc>${esc(g.group)}</a>`).join('');
  const un = document.querySelector('[data-ref-unsupported]');
  if (un) un.innerHTML = (window.TURTLE_UNSUPPORTED || []).map(([what, note]) => `<li><code>${esc(what)}</code>: ${esc(note)}</li>`).join('');
  toc && toc.addEventListener('click', e => { const a = e.target.closest('[data-toc]'); if (!a) return; e.preventDefault(); const h = document.querySelector(a.getAttribute('href')); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  /* "Try it": pick that program on the reference canvas (its picker is hidden) and play it. */
  const host = document.querySelector('[data-turtle="q4"]');
  list.addEventListener('click', async e => {
    const b = e.target.closest('[data-try]'); if (!b) return;
    const i = +b.dataset.try, st = typeof S !== 'undefined' && S.q4;
    if (!st || !st.tp) return;
    list.querySelectorAll('.ref-card.on').forEach(c => c.classList.remove('on'));
    b.closest('.ref-card').classList.add('on');
    const prev = st.tp.res;  // wait for Python to run this program (the old result is still there meanwhile)
    host.querySelector(`[data-prog="${i}"]`).click();
    for (let n = 0; n < 80 && !(st.tp.prog === i && st.tp.res && st.tp.res !== prev); n++) await new Promise(r => setTimeout(r, 100));
    await new Promise(r => setTimeout(r, 80));
    if (st.tp.res && !st.tp.res.error) host.querySelector('[data-tp="play"]').click();
    const pin = document.querySelector('.ref-pin');
    if (pin && pin.getBoundingClientRect().top < 0) pin.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
})();
