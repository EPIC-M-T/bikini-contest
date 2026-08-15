const EPIC_MODEL_LIMIT = 100;
const EPIC_MODEL_STORAGE = 'epic-bikini-contest-votes-v1';
const EPIC_VOTED_STORAGE = 'epic-bikini-contest-voted-models-v1';
const EPIC_HIDDEN_MODEL_IDS = new Set(['a6a3cb67-c935-4e54-b4bb-8f2b5efe898a', 'c959f967-a248-42fa-beff-f8c3cd6520d6', 'c06aff01-d06a-4908-8db2-55e5e75efbd8']);
const EPIC_MODEL_VOTE_MERGES = Object.freeze({
  '9bdc18ab-4988-4785-8645-724288997a1e': ['c959f967-a248-42fa-beff-f8c3cd6520d6']
});
const EPIC_EVENT_START = '2026-08-15T14:00:00-07:00';
const EPIC_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVwGX70-fL-QM1nfKqlSyNdrh0hq_CFwBsKvwYgZ_AEbJL6oLufGXzLLqP6zGEtlCN/exec';
const TOP_FIVE_EMPTY_TEXT = 'TOP 5 FAN FAVORITE TRACKER · CONTESTANTS POSTING SOON · CHECK BACK AFTER ENTRIES ARE APPROVED';
let starterModels = [];

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = 'epicJsonp_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
    const s = document.createElement('script');
    const sep = url.includes('?') ? '&' : '?';
    window[cb] = d => { cleanup(); resolve(d); };
    function cleanup() { delete window[cb]; s.remove(); }
    s.onerror = () => { cleanup(); reject(new Error('JSONP request failed')); };
    s.src = url + sep + 'callback=' + encodeURIComponent(cb) + '&_=' + Date.now();
    document.body.appendChild(s);
  });
}
function valueFrom() { for (const v of arguments) { if (v !== undefined && v !== null && String(v).trim() !== '') return v; } return ''; }
function escapeHtml(v) { return String(v || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function uniqueImages(arr) { const seen = {}; return arr.filter(Boolean).filter(u => { const k = String(u); if (seen[k]) return false; seen[k] = true; return true; }); }
function publicName(full) { const parts = String(full || '').trim().split(/\s+/).filter(Boolean); if (!parts.length) return 'Contestant'; if (parts.length === 1) return parts[0]; return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.'; }
function isHiddenModel(m) { return EPIC_HIDDEN_MODEL_IDS.has(String(m?.id || '')); }
function mergeHiddenModelVotes(models) {
  const byId = new Map(models.map(m => [String(m.id), m]));
  Object.entries(EPIC_MODEL_VOTE_MERGES).forEach(([targetId, sourceIds]) => {
    const target = byId.get(targetId);
    if (!target) return;
    const offset = sourceIds.reduce((sum, sourceId) => sum + Number(byId.get(sourceId)?.votes || 0), 0);
    target.voteOffset = offset;
    target.votes = Number(target.votes || 0) + offset;
  });
  return models;
}

function modelFromApproved(m, i) {
  const rawName = valueFrom(m.name, m.Name, `Contestant ${i + 1}`);
  const cityState = [valueFrom(m.city, m.City), valueFrom(m.state, m.State)].filter(Boolean).join('/') || valueFrom(m.hometown, m.Hometown, m.city, m.City, 'Las Vegas, NV');
  const headshot = valueFrom(m.headshotUrl, m.photo, m['Headshot URL'], m.image2Url, m['Image 2 URL'], m.image3Url, m['Image 3 URL'], 'assets/Prize-pool.webp');
  const image2 = valueFrom(m.image2Url, m['Image 2 URL'], headshot);
  const image3 = valueFrom(m.image3Url, m['Image 3 URL'], image2, headshot);
  const song = valueFrom(m.walkOutSong, m.walkoutSong, m['Walk-Out Song'], m['Walk Out Song'], m.favoriteMovie, m['Favorite Movie']);
  return {
    id: valueFrom(m.id, m.modelId, m['Model ID'], `approved-${i + 1}`),
    number: i + 1,
    rawName,
    name: publicName(rawName),
    instagram: valueFrom(m.instagram, m['IG Handle']),
    city: cityState,
    state: valueFrom(m.state, m.State),
    height: valueFrom(m.height, m.Height),
    song,
    status: 'Selected',
    votes: Number(valueFrom(m.voteCount, m.votes, m['Vote Count'], 0)),
    photo: headshot,
    image2,
    image3,
    images: uniqueImages([headshot, image2, image3])
  };
}

async function loadApprovedModels() {
  try {
    const data = await jsonp(EPIC_APPS_SCRIPT_URL + '?action=approvedModels&source=main-homepage');
    const models = Array.isArray(data?.models) ? data.models : [];
    starterModels = models.slice(0, EPIC_MODEL_LIMIT).map(modelFromApproved);
  } catch (err) {
    console.warn('Approved model feed did not load yet:', err);
    starterModels = [];
  }
}

function addEventCountdownStyles() {
  if (document.getElementById('epicEventCountdownStyles')) return;
  const style = document.createElement('style');
  style.id = 'epicEventCountdownStyles';
  style.textContent = `
.epic-countdown{width:min(940px,100%);margin:22px auto 0;padding:20px;border:1px solid rgba(73,236,255,.45);border-radius:26px;background:linear-gradient(135deg,rgba(3,7,19,.92),rgba(8,18,40,.78));box-shadow:0 22px 60px rgba(0,0,0,.42),0 0 32px rgba(73,236,255,.16),0 0 42px rgba(255,57,200,.12);text-align:center;overflow:hidden;position:relative}.epic-countdown:before{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 50% 0%,rgba(255,57,200,.24),transparent 42%),linear-gradient(120deg,transparent 0 38%,rgba(255,255,255,.12) 48%,transparent 58%);animation:epicCountdownGlow 5s ease-in-out infinite;pointer-events:none}.epic-countdown>*{position:relative;z-index:1}.epic-countdown-kicker{margin:0 0 8px;color:#49ecff;text-transform:uppercase;letter-spacing:.16em;font-weight:950;font-size:.78rem}.epic-countdown-title{margin:0;color:#fff8e9;font:950 clamp(1.6rem,3.4vw,3rem)/.95 Impact,Arial,sans-serif;text-transform:uppercase;letter-spacing:-.03em;text-shadow:0 5px 0 rgba(0,0,0,.44),0 0 22px rgba(255,57,200,.35)}.epic-countdown-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0 12px}.epic-time-box{padding:13px 10px;border-radius:18px;background:rgba(0,0,0,.46);border:1px solid rgba(255,255,255,.1)}.epic-time-box strong{display:block;color:#f8d478;font:950 clamp(1.55rem,3.8vw,3rem)/.9 Impact,Arial,sans-serif;text-shadow:0 0 18px rgba(255,216,112,.4)}.epic-time-box span{display:block;margin-top:5px;color:#e3d6ea;text-transform:uppercase;letter-spacing:.12em;font-size:.66rem;font-weight:900}.epic-countdown-note{margin:0;color:#fff;font-weight:850;line-height:1.45}.epic-countdown-note em{font-style:normal;color:#f8d478}.quick-facts.quick-facts{grid-template-columns:repeat(4,1fr);width:min(920px,100%)}@keyframes epicCountdownGlow{0%,100%{transform:translateX(-12%);opacity:.55}50%{transform:translateX(12%);opacity:1}}@media(max-width:880px){.epic-countdown{padding:16px;text-align:left}.epic-countdown-grid,.quick-facts.quick-facts{grid-template-columns:repeat(2,1fr)}.epic-countdown-note{font-size:.92rem}}@media(max-width:420px){.epic-countdown-grid,.quick-facts.quick-facts{grid-template-columns:1fr}.epic-time-box{text-align:center}}`;
  document.head.appendChild(style);
}

function addModelInteractionStyles() {
  if (document.getElementById('epicModelInteractionStyles')) return;
  const style = document.createElement('style');
  style.id = 'epicModelInteractionStyles';
  style.textContent = `
.model-card{cursor:pointer;min-height:430px}.model-meta{display:none!important}.model-content{padding-bottom:18px}.model-song{margin:6px 0 8px;color:#fff8e9;font:850 .78rem/1.22 Arial,sans-serif;text-shadow:0 2px 0 rgba(0,0,0,.75),0 0 12px #000;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.model-song b{color:#49ecff;text-transform:uppercase;letter-spacing:.08em;font-size:.64rem}.model-detail-btn{width:100%;min-height:42px;margin:9px 0 10px!important;border:0;border-radius:999px;background:linear-gradient(100deg,#ff39c8,#49ecff);color:#06101b;font-weight:950;text-transform:uppercase;letter-spacing:.07em;cursor:pointer;box-shadow:0 10px 24px rgba(0,0,0,.38),0 0 18px rgba(255,57,200,.24)}.vote-row{display:grid!important;grid-template-columns:minmax(0,1fr) auto!important;gap:12px!important;align-items:center!important;margin-top:0!important}.vote-btn{min-height:44px!important;padding:0 10px!important}.vote-count{height:44px!important;min-width:56px!important}.vote-btn[disabled]{opacity:.55;cursor:not-allowed;filter:grayscale(.28)}.model-gallery-modal{position:fixed;inset:0;z-index:2000;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(0,0,0,.88);backdrop-filter:blur(10px);overflow:hidden}.model-gallery-modal.is-open{display:flex}.model-gallery-box{width:min(1180px,calc(100vw - 28px));height:min(92svh,860px);padding:20px;border:1px solid rgba(255,216,112,.36);border-radius:28px;background:linear-gradient(135deg,rgba(3,7,19,.98),rgba(12,22,44,.94));box-shadow:0 30px 90px rgba(0,0,0,.7),0 0 42px rgba(255,57,200,.2);overflow:hidden;display:grid;grid-template-rows:auto 1fr}.model-gallery-head{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:14px}.model-gallery-head h3{margin:0;color:#f8d478;font:950 clamp(1.65rem,4vw,3.2rem)/.95 Impact,Arial,sans-serif;text-transform:uppercase}.model-gallery-close{min-width:46px;height:46px;border-radius:999px;border:1px solid rgba(73,236,255,.42);background:linear-gradient(100deg,#ff39c8,#49ecff);color:#06101b;font-weight:950;cursor:pointer}.model-modal-grid{min-height:0;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(320px,.8fr);gap:16px}.model-gallery-images{min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;overflow:hidden}.model-gallery-images img{width:100%;height:100%;min-height:0;object-fit:cover;border-radius:18px;border:1px solid rgba(255,216,112,.28);background:#000}.model-modal-details{min-height:0;overflow:hidden;padding:18px;border:1px solid rgba(255,216,112,.3);border-radius:22px;background:rgba(0,0,0,.38);display:flex;flex-direction:column}.model-modal-details h4{margin:0 0 10px;color:#f8d478;font:950 clamp(1.7rem,3vw,3rem)/.95 Impact,Arial,sans-serif;text-transform:uppercase;text-shadow:0 4px 0 rgba(0,0,0,.45)}.model-detail-number{color:#49ecff;text-transform:uppercase;letter-spacing:.14em;font-weight:950;font-size:.78rem;margin-bottom:6px}.model-details{display:grid;gap:0;margin:2px 0 14px}.model-details div{display:grid;grid-template-columns:.85fr 1.15fr;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:.9rem;line-height:1.25}.model-details b{color:#f8d478;text-transform:uppercase;letter-spacing:.08em;font-size:.7rem}.model-details span{color:#fff;font-weight:850}.model-modal-actions{margin-top:auto;display:grid;gap:10px}.model-secondary-btn{min-height:42px;border:1px solid rgba(73,236,255,.38);border-radius:999px;background:rgba(0,0,0,.46);color:#fff;font-weight:950;text-transform:uppercase;letter-spacing:.08em;cursor:pointer}
@media(max-width:900px){.model-gallery-box{height:min(94svh,900px);overflow:hidden}.model-modal-grid{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}.model-gallery-images{grid-template-columns:repeat(3,minmax(0,1fr));max-height:48svh}.model-modal-details{max-height:34svh}.model-details div{font-size:.8rem;padding:6px 0}}
@media(max-width:560px){.model-detail-btn{margin:11px 0 10px!important}.vote-row{gap:10px!important}.vote-btn,.vote-count{min-height:44px!important;height:44px!important}.model-gallery-modal{padding:6px!important;align-items:stretch!important}.model-gallery-box{width:calc(100vw - 12px)!important;height:calc(100svh - 12px)!important;max-height:none!important;padding:10px!important;border-radius:18px!important;grid-template-rows:auto minmax(0,1fr)!important}.model-gallery-head{margin-bottom:8px!important}.model-gallery-head h3{font-size:1.15rem!important;line-height:1!important}.model-gallery-close{min-width:40px!important;height:40px!important}.model-modal-grid{height:100%!important;min-height:0!important;display:grid!important;grid-template-columns:1fr!important;grid-template-rows:minmax(0,42svh) minmax(0,1fr)!important;gap:8px!important;overflow:hidden!important}.model-gallery-images{height:100%!important;max-height:none!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important;overflow:hidden!important}.model-gallery-images img{border-radius:12px!important}.model-modal-details{height:100%!important;max-height:none!important;min-height:0!important;padding:10px!important;overflow:auto!important;display:flex!important;flex-direction:column!important;-webkit-overflow-scrolling:touch!important}.model-detail-number{font-size:.7rem!important;margin-bottom:3px!important}.model-modal-details h4{font-size:1.35rem!important;margin-bottom:5px!important}.model-details{margin:0 0 8px!important}.model-details div{grid-template-columns:1fr!important;gap:1px!important;padding:4px 0!important;font-size:.74rem!important;line-height:1.15!important}.model-details b{font-size:.62rem!important}.model-modal-actions{margin-top:auto!important;position:sticky!important;bottom:0!important;padding-top:8px!important;background:linear-gradient(180deg,rgba(3,7,19,0),rgba(3,7,19,.98) 28%)!important}.model-modal-actions .vote-btn,.model-secondary-btn{min-height:42px!important;height:42px!important;font-size:.76rem!important}}`;
  document.head.appendChild(style);
}

function formatCountdown(ms) { if (ms <= 0) return {days:'00',hours:'00',minutes:'00',seconds:'00'}; const total = Math.floor(ms / 1000), days = Math.floor(total / 86400), hours = Math.floor((total % 86400) / 3600), minutes = Math.floor((total % 3600) / 60), seconds = total % 60; return {days:String(days),hours:String(hours).padStart(2,'0'),minutes:String(minutes).padStart(2,'0'),seconds:String(seconds).padStart(2,'0')}; }
function makeCountdown(label = 'Event Countdown') {
  const box = document.createElement('div');
  box.className = 'epic-countdown';
  box.innerHTML = '<p class="epic-countdown-kicker">' + label + '</p><h3 class="epic-countdown-title">August 15, 2026 · 2PM–5PM</h3><div class="epic-countdown-grid"><div class="epic-time-box"><strong data-days>00</strong><span>Days</span></div><div class="epic-time-box"><strong data-hours>00</strong><span>Hours</span></div><div class="epic-time-box"><strong data-minutes>00</strong><span>Minutes</span></div><div class="epic-time-box"><strong data-seconds>00</strong><span>Seconds</span></div></div><p class="epic-countdown-note">Day-of-event submissions stop at <em>1:00 PM</em>. Event runs <em>2:00 PM–5:00 PM</em> at Tailgate Beach Club.</p>';
  const update = () => { const t = formatCountdown(new Date(EPIC_EVENT_START).getTime() - Date.now()); box.querySelector('[data-days]').textContent = t.days; box.querySelector('[data-hours]').textContent = t.hours; box.querySelector('[data-minutes]').textContent = t.minutes; box.querySelector('[data-seconds]').textContent = t.seconds; };
  update(); setInterval(update, 1000); return box;
}
function insertHeroPrize() { const heroArt = document.querySelector('.hero-art'); if (!heroArt || document.querySelector('.hero-prize-under')) return; const prize = document.createElement('figure'); prize.className = 'hero-prize-under'; prize.innerHTML = '<img src="assets/Prize-pool.webp" alt="Prize Pool graphic showing first place $10,000, second place $5,000, and third place $2,500.">'; heroArt.insertAdjacentElement('afterend', prize); }
function insertTopFiveTicker(afterEl) { if (document.querySelector('.top-five-ticker')) return; const t = document.createElement('div'); t.className = 'top-five-ticker'; const chip = `<span class="top-five-chip top-five-empty">${TOP_FIVE_EMPTY_TEXT}</span>`; t.innerHTML = '<div class="top-five-label">Top 5 Fan Favorite Tracker</div><div class="top-five-track-wrap"><div class="top-five-track" data-top-five-ticker>' + chip.repeat(8) + '</div></div>'; afterEl.insertAdjacentElement('afterend', t); }

function addHomepageEventUpdates() {
  addEventCountdownStyles();
  document.querySelectorAll('.kicker').forEach(el => { if (/August 14/i.test(el.textContent)) el.textContent = 'August 15, 2026 · 2PM–5PM · Tailgate Beach Club at Mandalay Bay'; });
  const heroPanel = document.querySelector('.hero-copy-panel');
  if (heroPanel && !document.querySelector('.hero-event-countdown')) { const timer = makeCountdown('Bikini Contest Countdown'); timer.classList.add('hero-event-countdown'); heroPanel.insertAdjacentElement('afterend', timer); insertTopFiveTicker(timer); }
  const facts = [...document.querySelectorAll('.quick-facts .fact')];
  if (facts[0]) facts[0].innerHTML = '<strong>$20K+</strong><span>Cash + Prizes</span>';
  if (facts[1]) facts[1].innerHTML = '<strong>Up To 100</strong><span>Girls Posted</span>';
  if (facts[2]) facts[2].innerHTML = '<strong>$2.5K</strong><span>Fan Vote Cabana</span>';
  const q = document.querySelector('.quick-facts');
  if (q && !q.querySelector('[data-event-time-fact]')) { const f = document.createElement('div'); f.className = 'fact'; f.dataset.eventTimeFact = 'true'; f.innerHTML = '<strong>2PM–5PM</strong><span>Event Time</span>'; q.appendChild(f); }
}

function addJudgingAndRegistrationInfo() {
  const style = document.createElement('style');
  style.textContent = `.judging-note{margin:22px auto 0;width:min(940px,100%);padding:18px 20px;border:1px solid rgba(73,236,255,.38);border-radius:22px;background:linear-gradient(180deg,rgba(3,7,19,.82),rgba(3,7,19,.66));box-shadow:0 18px 42px rgba(0,0,0,.34),0 0 22px rgba(73,236,255,.12);color:#fff;text-align:left;line-height:1.55}.judging-note strong{color:#f8d478;text-transform:uppercase;letter-spacing:.08em;font-size:.86rem;display:block;margin-bottom:6px}.judging-note p{margin:0;color:#e3d6ea;font-size:1rem;line-height:1.55}.judging-note p+p{margin-top:10px}.judging-note .important{color:#fff8e9;font-weight:850}@media(max-width:880px){.judging-note{padding:16px;margin-top:18px}.judging-note p{font-size:.95rem}}`;
  document.head.appendChild(style);
  document.querySelectorAll('a[href="#vote"]').forEach(a => { if (/vote/i.test(a.textContent)) a.textContent = 'Fan Favorite Info'; });
  const heroCopy = document.querySelector('.hero-copy');
  if (heroCopy) heroCopy.textContent = 'A high-energy, judge-selected bikini contest at Tailgate Beach Club at Mandalay Bay. Models can apply online for the opportunity to be featured and promoted before the event. Day-of-event submissions close at 1:00 PM, and the live event runs 2:00 PM–5:00 PM on August 15, 2026.';
  const heroPanel = document.querySelector('.hero-copy-panel');
  if (heroPanel && !document.querySelector('.judging-note.hero-judging-note')) { const note = document.createElement('div'); note.className = 'judging-note hero-judging-note'; note.innerHTML = '<strong>How Winners Are Selected</strong><p><span class="important">This is not a vote-based competition.</span> Overall winners will be selected by judges based on the official competition criteria, including stage presence, confidence, presentation, style, and overall contest performance.</p><p>A separate <span class="important">Fan Favorite</span> award includes a <span class="important">$2,500 Private Tailgate Cabana prize package</span> for the contestant who receives the most audience support.</p>'; heroPanel.appendChild(note); }
  const contestLede = document.querySelector('#contest .section-lede');
  if (contestLede) contestLede.textContent = 'The EPIC Bikini Contest brings selected models to Tailgate Beach Club at Mandalay Bay on August 15, 2026 from 2:00 PM–5:00 PM. The overall winner will be selected by judges based on the competition criteria. Fan Favorite support is a separate audience-recognition feature with a $2,500 Private Tailgate Cabana prize package.';
  const voteHead = document.querySelector('#vote .showcase-head h2');
  if (voteHead) voteHead.textContent = 'Meet The Girls. Support Fan Favorite.';
  const voteIntro = document.querySelector('#vote .showcase-head p');
  if (voteIntro) voteIntro.textContent = 'Approved contestants will be posted here as numbered model cards with promotional photos, IG handles, hometowns, heights, and TOP 10 walk-out song choices.';
  const modelNote = document.querySelector('.model-note');
  if (modelNote) modelNote.textContent = 'Bring the energy, rally your friends, and make some noise. Fan Favorite support helps decide who takes home the separate $2,500 Private Tailgate Cabana prize package, while the overall contest winners are selected live by the judges.';
  const applyLede = document.querySelector('#models .section-lede');
  if (applyLede) applyLede.textContent = 'Models should submit a valid ID, preferred headshot, 3–5 images, height, Instagram, city/state, contact details, and their TOP 10 walk-out song choice.';
  const stats = document.querySelector('#models .checklist .check:nth-child(3)');
  if (stats) stats.innerHTML = '<b>03 · Public Profile Info</b>IG handle, city/hometown, height, and your TOP 10 walk-out song choice.';
}

function getVotes(){try{return JSON.parse(localStorage.getItem(EPIC_MODEL_STORAGE)||'{}')}catch{return{}}}
function setVotes(v){localStorage.setItem(EPIC_MODEL_STORAGE,JSON.stringify(v))}
function getVoted(){try{return JSON.parse(localStorage.getItem(EPIC_VOTED_STORAGE)||'{}')}catch{return{}}}
function setVoted(v){localStorage.setItem(EPIC_VOTED_STORAGE,JSON.stringify(v))}
async function getVoterKey(){try{const cached=sessionStorage.getItem('epic-voter-ip-key');if(cached)return cached;const r=await fetch('https://api.ipify.org?format=json',{cache:'no-store'});const j=await r.json();if(j&&j.ip){const key='ip:'+j.ip;sessionStorage.setItem('epic-voter-ip-key',key);return key}}catch(e){console.warn('IP voter key unavailable; using browser key',e)}const key=localStorage.getItem('epic-voter-key')||crypto?.randomUUID?.()||String(Date.now()+Math.random());localStorage.setItem('epic-voter-key',key);return'browser:'+key}
function hydrateModels(){const custom=Array.isArray(window.EPIC_APPROVED_MODELS)?window.EPIC_APPROVED_MODELS:starterModels;return custom.slice(0,EPIC_MODEL_LIMIT).map((m,i)=>({...m,number:i+1,id:m.id||`contestant-${String(i+1).padStart(3,'0')}`,votes:Number(m.votes||0)}))}
function renderTopFive(models){const ticker=document.querySelector('[data-top-five-ticker]');if(!ticker)return;const top=[...models].sort((a,b)=>Number(b.votes||0)-Number(a.votes||0)).slice(0,5);let chips;if(!top.length){chips=Array.from({length:8},()=>`<span class="top-five-chip top-five-empty">${TOP_FIVE_EMPTY_TEXT}</span>`).join('')}else{const set=top.map((m,i)=>`<span class="top-five-chip"><b>#${i+1}</b> <span>${escapeHtml(m.name||'Contestant')}</span> <strong>${Number(m.votes||0)} votes</strong></span>`).join('');chips=set+set+set+set}ticker.innerHTML=chips}
function detailRows(m){return [['IG Handle',m.instagram],['City / Hometown',m.city],['Height',m.height],['TOP 10 Walk-Out Song',m.song]].filter(x=>valueFrom(x[1]))}
function ensureModal(){let modal=document.querySelector('.model-gallery-modal');if(modal)return modal;modal=document.createElement('div');modal.className='model-gallery-modal';modal.innerHTML='<div class="model-gallery-box" role="dialog" aria-modal="true"><div class="model-gallery-head"><h3 data-modal-title>Contestant Details</h3><button class="model-gallery-close" type="button" aria-label="Close">×</button></div><div class="model-modal-grid"><div class="model-gallery-images" data-modal-images></div><aside class="model-modal-details"><div class="model-detail-number" data-modal-number></div><h4 data-modal-name></h4><div class="model-details" data-modal-details></div><div class="model-modal-actions"><button class="vote-btn" type="button" data-modal-vote>Support Fan Favorite</button><button class="model-secondary-btn" type="button" data-modal-close>Close Gallery</button></div></aside></div></div>';document.body.appendChild(modal);modal.addEventListener('click',e=>{if(e.target===modal||e.target.closest('.model-gallery-close')||e.target.closest('[data-modal-close]'))modal.classList.remove('is-open')});document.addEventListener('keydown',e=>{if(e.key==='Escape')modal.classList.remove('is-open')});return modal}
function openModelModal(m,onVote){const modal=ensureModal();modal.querySelector('[data-modal-title]').textContent=`Contestant #${String(m.number).padStart(3,'0')}`;modal.querySelector('[data-modal-number]').textContent=`Contestant #${String(m.number).padStart(3,'0')}`;modal.querySelector('[data-modal-name]').textContent=m.name||`Contestant ${m.number}`;modal.querySelector('[data-modal-images]').innerHTML=(m.images&&m.images.length?m.images:[m.photo]).map(u=>`<img src="${u}" alt="${escapeHtml(m.name)} promotional photo">`).join('');modal.querySelector('[data-modal-details]').innerHTML=detailRows(m).map(r=>`<div><b>${escapeHtml(r[0])}</b><span>${escapeHtml(r[1])}</span></div>`).join('');const btn=modal.querySelector('[data-modal-vote]');btn.dataset.vote=m.id;btn.disabled=!!getVoted()[m.id];btn.textContent=btn.disabled?'Already Supported':'Support Fan Favorite';btn.onclick=()=>onVote(m.id);modal.classList.add('is-open')}
function renderModels(){const grid=document.querySelector('[data-model-grid]'),counter=document.querySelector('[data-model-counter]'),posted=document.querySelector('[data-model-posted]'),search=document.querySelector('[data-model-search]'),filter=document.querySelector('[data-model-filter]'),empty=document.querySelector('[data-model-empty]');if(!grid)return;const stored=getVotes();let models=mergeHiddenModelVotes(hydrateModels().map(m=>({...m,votes:m.votes+(stored[m.id]||0)})));async function voteFor(id){const voted=getVoted();if(voted[id])return;const voter=await getVoterKey();let backendDuplicate=false;try{const result=await jsonp(EPIC_APPS_SCRIPT_URL+'?action=vote&modelId='+encodeURIComponent(id)+'&voterKey='+encodeURIComponent(voter)+'&source=main-homepage');backendDuplicate=!!result?.duplicate;if(result&&typeof result.voteCount!=='undefined')models=models.map(m=>m.id===id?{...m,votes:(Number(result.voteCount)||0)+Number(m.voteOffset||0)}:m)}catch(err){console.warn('Vote backend did not update',err)}if(!backendDuplicate){const votes=getVotes();votes[id]=(votes[id]||0)+1;setVotes(votes);models=models.map(m=>m.id===id?{...m,votes:m.votes+1}:m)}voted[id]=true;setVoted(voted);draw();const modal=ensureModal();const current=models.find(m=>m.id===id);if(modal.classList.contains('is-open')&&current)openModelModal(current,voteFor)}function draw(){const q=(search?.value||'').toLowerCase().trim();const f=filter?.value||'all';const voted=getVoted();const visible=models.filter(m=>!isHiddenModel(m));const filtered=visible.filter(m=>(!q||`${m.name} ${m.city} ${m.status} ${m.instagram} ${m.song}`.toLowerCase().includes(q))&&(f==='all'||String(m.status||'selected').toLowerCase().includes(f)));grid.innerHTML=filtered.map(m=>`<article class="model-card" style="--model-photo:url('${m.photo}')" data-card data-id="${m.id}"><span class="model-number">#${String(m.number).padStart(3,'0')}</span><div class="model-photo" aria-hidden="true"></div><div class="model-content"><span class="model-tag">${m.status||'Selected'}</span><h3 class="model-name">${escapeHtml(m.name)}</h3>${m.song?`<p class="model-song"><b>Walk-Out Song</b><br>${escapeHtml(m.song)}</p>`:''}<button class="model-detail-btn" type="button" data-details="${m.id}">View Profile + Photos</button><div class="vote-row"><button class="vote-btn" type="button" data-vote="${m.id}" ${voted[m.id]?'disabled':''}>${voted[m.id]?'Already Supported':'Support Fan Favorite'}</button><span class="vote-count" data-count="${m.id}">${Number(m.votes||0)}</span></div></div></article>`).join('');if(counter)counter.textContent=String(Math.min(visible.length,EPIC_MODEL_LIMIT));if(posted)posted.textContent=String(visible.filter(m=>String(m.status||'selected').toLowerCase().includes('selected')).length);if(empty)empty.hidden=filtered.length!==0;renderTopFive(visible);requestAnimationFrame(()=>document.querySelectorAll('[data-card]').forEach((c,i)=>setTimeout(()=>c.classList.add('is-visible'),i*55)))}grid.addEventListener('click',e=>{const detail=e.target.closest('[data-details]');if(detail){const m=models.find(x=>x.id===detail.dataset.details);if(m)openModelModal(m,voteFor);return}const btn=e.target.closest('[data-vote]');if(btn&&!btn.disabled){voteFor(btn.dataset.vote);return}const card=e.target.closest('[data-card]');if(card&&!e.target.closest('button')){const m=models.find(x=>x.id===card.dataset.id);if(m)openModelModal(m,voteFor)}});search?.addEventListener('input',draw);filter?.addEventListener('change',draw);draw()}

document.addEventListener('DOMContentLoaded', async () => { insertHeroPrize(); addHomepageEventUpdates(); addJudgingAndRegistrationInfo(); addModelInteractionStyles(); await loadApprovedModels(); renderModels(); });