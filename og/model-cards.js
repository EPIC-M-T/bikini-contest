(() => {
  const API_URL = '';
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const img = (model, key, fallback) => model[key] || model[fallback] || '../assets/bikini-final (1920 x 1920 px)(1).png';

  function jsonp(url, params = {}) {
    return new Promise(resolve => {
      if (!url) return resolve({ models: [] });
      const cb = `epicModels${Date.now()}`;
      const s = document.createElement('script');
      window[cb] = data => { delete window[cb]; s.remove(); resolve(data || {}); };
      s.onerror = () => { delete window[cb]; s.remove(); resolve({ models: [] }); };
      s.src = `${url}${url.includes('?') ? '&' : '?'}${new URLSearchParams({ ...params, callback: cb })}`;
      document.body.appendChild(s);
    });
  }

  function shell() {
    if (document.querySelector('#approvedModels')) return;
    const target = document.querySelector('.hero-prize') || document.querySelector('main');
    target.insertAdjacentHTML('afterend', `<section class="model-roster-section" id="approvedModels"><div class="model-roster-head"><p class="model-roster-kicker">Approved Entries</p><h2 class="model-roster-title">Model Card Roster</h2><p class="model-roster-copy">Approved submissions will appear here as numbered model cards. Tap a headshot to reveal two more images and the model info card.</p><p class="model-roster-note">Visitor voting is for fun and entertainment. Final contestant selection is made by EPIC Models &amp; Talent staff — but your vote may sway the judges.</p></div><div class="model-roster-grid" id="modelRosterGrid"></div><div class="model-empty-state" id="modelEmptyState"><strong>Approved model cards coming soon.</strong><span>Once EPIC staff approves submissions, cards will publish here from the Google Sheet approval workflow.</span></div><div class="model-scoreboard"><h3>Fan Vote Tracker</h3><div id="modelScoreRows"><p class="model-score-empty">Fan voting opens when the first model card is approved.</p></div></div></section><div class="model-reveal-overlay" id="modelRevealOverlay"></div><div class="model-reveal" id="modelReveal"><button class="model-close-button" type="button">Close Gallery</button><div class="model-reveal__scene" id="modelRevealScene"></div></div>`);
  }

  function render(models = []) {
    shell();
    const grid = document.querySelector('#modelRosterGrid');
    const empty = document.querySelector('#modelEmptyState');
    const scores = document.querySelector('#modelScoreRows');
    if (!grid || !scores) return;
    grid.innerHTML = '';
    scores.innerHTML = '';
    if (!models.length) { empty.style.display = 'grid'; scores.innerHTML = '<p class="model-score-empty">Fan voting opens when the first model card is approved.</p>'; return; }
    empty.style.display = 'none';
    models.forEach((m, i) => {
      const n = m.number || String(i + 1).padStart(2, '0');
      const card = document.createElement('article');
      card.className = 'model-card';
      card.tabIndex = 0;
      card.innerHTML = `<div class="model-card__image" style="background-image:url('${img(m,'headshotUrl','image2Url')}')"></div><div class="model-card__number">#${esc(n)}</div><div class="model-card__vote">♡ ${Number(m.voteCount || 0)}</div><div class="model-card__body"><h3 class="model-card__name">${esc(m.name || 'Approved Model')}</h3><p class="model-card__meta">${esc(m.city || 'Las Vegas')}${m.state ? ', ' + esc(m.state) : ''}</p><p class="model-card__open">Tap to reveal card</p></div>`;
      card.addEventListener('click', () => openModel(m, n));
      card.addEventListener('keydown', e => { if (e.key === 'Enter') openModel(m, n); });
      grid.appendChild(card);
    });
    const max = Math.max(1, ...models.map(m => Number(m.voteCount || 0)));
    [...models].sort((a,b) => Number(b.voteCount || 0) - Number(a.voteCount || 0)).forEach((m, i) => {
      const count = Number(m.voteCount || 0);
      scores.insertAdjacentHTML('beforeend', `<div class="score-row"><span class="score-name">#${esc(m.number || i + 1)} ${esc(m.name || 'Model')}</span><span class="score-track"><span class="score-bar" style="width:${Math.max(4, Math.round((count / max) * 100))}%"></span></span><span class="score-count">${count}</span></div>`);
    });
  }

  function openModel(m, n) {
    const overlay = document.querySelector('#modelRevealOverlay');
    const reveal = document.querySelector('#modelReveal');
    const scene = document.querySelector('#modelRevealScene');
    const facts = [['Name',m.name],['Age',m.age],['IG Handle',m.instagram || m.igHandle],['City',m.city],['State',m.state],['Height',m.height],['Measurements',m.measurements],['Natural Hair Color',m.naturalHairColor],['Natural Eye Color',m.naturalEyeColor]];
    scene.innerHTML = `<article class="model-reveal-card"><img src="${img(m,'image2Url','headshotUrl')}" alt="${esc(m.name)} image two"></article><article class="model-reveal-card"><img src="${img(m,'image3Url','headshotUrl')}" alt="${esc(m.name)} image three"></article><article class="model-reveal-card model-info-card"><p class="model-info-number">Contestant #${esc(n)}</p><h3>${esc(m.name || 'Approved Model')}</h3><div class="model-facts">${facts.map(([label,value]) => `<div class="model-fact"><span>${label}</span><span>${esc(value || '—')}</span></div>`).join('')}</div><button class="model-vote-button" type="button" data-model-id="${esc(m.id || m.modelId || n)}">Vote For #${esc(n)}</button></article>`;
    overlay.classList.add('is-active'); reveal.classList.add('is-active');
  }

  function closeModel(){document.querySelector('#modelRevealOverlay')?.classList.remove('is-active');document.querySelector('#modelReveal')?.classList.remove('is-active');}
  document.addEventListener('click', e => { if (e.target.matches('#modelRevealOverlay,.model-close-button')) closeModel(); const b = e.target.closest('.model-vote-button'); if (b) { const k = `epic-voted-${b.dataset.modelId}`; if (localStorage.getItem(k)) { alert('You already voted for this model from this browser.'); return; } localStorage.setItem(k,'1'); if(API_URL) jsonp(API_URL,{action:'vote',modelId:b.dataset.modelId,source:location.pathname}); alert('Vote captured. Fan voting is for fun and may sway the judges.'); } });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModel(); });
  shell();
  jsonp(API_URL, { action: 'approvedModels' }).then(data => render(data.models || []));
})();
