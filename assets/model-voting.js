const EPIC_MODEL_LIMIT=100;
const EPIC_MODEL_STORAGE='epic-bikini-contest-votes-v1';
const EPIC_EVENT_START='2026-08-15T14:00:00-07:00';
const EPIC_SUBMISSION_DEADLINE='2026-08-15T13:00:00-07:00';
const starterModels=[];

function addEventCountdownStyles(){
  if(document.getElementById('epicEventCountdownStyles'))return;
  const style=document.createElement('style');
  style.id='epicEventCountdownStyles';
  style.textContent=`
    .epic-countdown{width:min(940px,100%);margin:22px auto 0;padding:20px;border:1px solid rgba(73,236,255,.45);border-radius:26px;background:linear-gradient(135deg,rgba(3,7,19,.92),rgba(8,18,40,.78));box-shadow:0 22px 60px rgba(0,0,0,.42),0 0 32px rgba(73,236,255,.16),0 0 42px rgba(255,57,200,.12);text-align:center;overflow:hidden;position:relative}
    .epic-countdown:before{content:"";position:absolute;inset:-30%;background:radial-gradient(circle at 50% 0%,rgba(255,57,200,.24),transparent 42%),linear-gradient(120deg,transparent 0 38%,rgba(255,255,255,.12) 48%,transparent 58%);animation:epicCountdownGlow 5s ease-in-out infinite;pointer-events:none}
    .epic-countdown>*{position:relative;z-index:1}.epic-countdown-kicker{margin:0 0 8px;color:#49ecff;text-transform:uppercase;letter-spacing:.16em;font-weight:950;font-size:.78rem}.epic-countdown-title{margin:0;color:#fff8e9;font:950 clamp(1.6rem,3.4vw,3rem)/.95 Impact,Arial,sans-serif;text-transform:uppercase;letter-spacing:-.03em;text-shadow:0 5px 0 rgba(0,0,0,.44),0 0 22px rgba(255,57,200,.35)}
    .epic-countdown-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0 12px}.epic-time-box{padding:13px 10px;border-radius:18px;background:rgba(0,0,0,.46);border:1px solid rgba(255,255,255,.1)}.epic-time-box strong{display:block;color:#f8d478;font:950 clamp(1.55rem,3.8vw,3rem)/.9 Impact,Arial,sans-serif;text-shadow:0 0 18px rgba(255,216,112,.4)}.epic-time-box span{display:block;margin-top:5px;color:#e3d6ea;text-transform:uppercase;letter-spacing:.12em;font-size:.66rem;font-weight:900}.epic-countdown-note{margin:0;color:#fff;font-weight:850;line-height:1.45}.epic-countdown-note em{font-style:normal;color:#f8d478}
    .fan-favorite-prize{margin:22px 0 0;padding:22px;border:1px solid rgba(255,216,112,.48);border-radius:24px;background:linear-gradient(135deg,rgba(255,57,200,.18),rgba(73,236,255,.12)),rgba(0,0,0,.42);box-shadow:0 20px 52px rgba(0,0,0,.34),0 0 28px rgba(255,57,200,.16)}.fan-favorite-prize strong{display:block;color:#49ecff;text-transform:uppercase;letter-spacing:.14em;font-size:.78rem}.fan-favorite-prize h3{margin:8px 0;color:#f8d478;font:950 clamp(1.75rem,3.5vw,3rem)/.98 Impact,Arial,sans-serif;text-transform:uppercase;text-shadow:0 4px 0 rgba(0,0,0,.42),0 0 24px rgba(255,216,112,.32)}.fan-favorite-prize p{margin:0;color:#fff8e9;line-height:1.55;font-weight:750}
    .quick-facts.quick-facts{grid-template-columns:repeat(4,1fr);width:min(920px,100%)}
    @keyframes epicCountdownGlow{0%,100%{transform:translateX(-12%);opacity:.55}50%{transform:translateX(12%);opacity:1}}
    @media(max-width:880px){.epic-countdown{padding:16px;text-align:left}.epic-countdown-grid,.quick-facts.quick-facts{grid-template-columns:repeat(2,1fr)}.epic-countdown-note{font-size:.92rem}.fan-favorite-prize{padding:18px}.fan-favorite-prize h3{font-size:clamp(1.5rem,8vw,2.35rem)}}
    @media(max-width:420px){.epic-countdown-grid,.quick-facts.quick-facts{grid-template-columns:1fr}.epic-time-box{text-align:center}}
  `;
  document.head.appendChild(style);
}

function formatCountdown(ms){
  if(ms<=0)return {days:'00',hours:'00',minutes:'00',seconds:'00'};
  const total=Math.floor(ms/1000),days=Math.floor(total/86400),hours=Math.floor((total%86400)/3600),minutes=Math.floor((total%3600)/60),seconds=total%60;
  return {days:String(days),hours:String(hours).padStart(2,'0'),minutes:String(minutes).padStart(2,'0'),seconds:String(seconds).padStart(2,'0')};
}

function makeCountdown(label='Event Countdown'){
  const box=document.createElement('div');
  box.className='epic-countdown';
  box.innerHTML='<p class="epic-countdown-kicker">'+label+'</p><h3 class="epic-countdown-title">August 15, 2026 · 2PM–5PM</h3><div class="epic-countdown-grid"><div class="epic-time-box"><strong data-days>00</strong><span>Days</span></div><div class="epic-time-box"><strong data-hours>00</strong><span>Hours</span></div><div class="epic-time-box"><strong data-minutes>00</strong><span>Minutes</span></div><div class="epic-time-box"><strong data-seconds>00</strong><span>Seconds</span></div></div><p class="epic-countdown-note">Day-of-event submissions stop at <em>1:00 PM</em>. Event runs <em>2:00 PM–5:00 PM</em> at Tailgate Beach Club.</p>';
  const update=()=>{const t=formatCountdown(new Date(EPIC_EVENT_START).getTime()-Date.now());box.querySelector('[data-days]').textContent=t.days;box.querySelector('[data-hours]').textContent=t.hours;box.querySelector('[data-minutes]').textContent=t.minutes;box.querySelector('[data-seconds]').textContent=t.seconds};
  update();setInterval(update,1000);return box;
}

function insertHeroPrize(){
  const heroArt=document.querySelector('.hero-art');
  if(!heroArt||document.querySelector('.hero-prize-under'))return;
  const prize=document.createElement('figure');
  prize.className='hero-prize-under';
  prize.innerHTML='<img src="assets/Prize-pool.webp" alt="Prize Pool graphic showing first place $10,000, second place $5,000, and third place $2,500.">';
  heroArt.insertAdjacentElement('afterend',prize);
}

function addHomepageEventUpdates(){
  addEventCountdownStyles();
  document.querySelectorAll('.kicker').forEach(el=>{if(/August 14/i.test(el.textContent))el.textContent='August 15, 2026 · 2PM–5PM · Tailgate Beach Club at Mandalay Bay'});
  const heroPanel=document.querySelector('.hero-copy-panel');
  if(heroPanel&&!document.querySelector('.hero-event-countdown')){const timer=makeCountdown('Bikini Contest Countdown');timer.classList.add('hero-event-countdown');heroPanel.insertAdjacentElement('afterend',timer)}
  const facts=[...document.querySelectorAll('.quick-facts .fact')];
  if(facts[0])facts[0].innerHTML='<strong>$20K+</strong><span>Cash + Prizes</span>';
  if(facts[1])facts[1].innerHTML='<strong>Up To 100</strong><span>Girls Posted</span>';
  if(facts[2])facts[2].innerHTML='<strong>$2.5K</strong><span>Fan Vote Cabana</span>';
  const q=document.querySelector('.quick-facts');
  if(q&&!q.querySelector('[data-event-time-fact]')){const f=document.createElement('div');f.className='fact';f.dataset.eventTimeFact='true';f.innerHTML='<strong>2PM–5PM</strong><span>Event Time</span>';q.appendChild(f)}
  const prizePanel=document.querySelector('#prizes .prize-panel');
  if(prizePanel&&!document.querySelector('.fan-favorite-prize')){const cabana=document.createElement('div');cabana.className='fan-favorite-prize';cabana.innerHTML='<strong>Fan Favorite Prize Package</strong><h3>$2,500 Private Tailgate Cabana</h3><p>The contestant who receives the most Fan Favorite votes will receive an additional $2,500 Private Tailgate Cabana prize package. Overall contest winners are still selected by judges; Fan Favorite is a separate audience-vote award.</p>';const graphic=prizePanel.querySelector('.prize-graphic');(graphic||prizePanel.querySelector('h2'))?.insertAdjacentElement('afterend',cabana)}
  const prizeNote=document.querySelector('#prizes .prize-note');
  if(prizeNote)prizeNote.textContent='Selected contestants will compete live at Tailgate Beach Club at Mandalay Bay on August 15, 2026. Event time is 2:00 PM–5:00 PM, and day-of-event submissions close at 1:00 PM.';
}

function addJudgingAndRegistrationInfo(){
  const style=document.createElement('style');
  style.textContent=`
    .judging-note{margin:22px auto 0;width:min(940px,100%);padding:18px 20px;border:1px solid rgba(73,236,255,.38);border-radius:22px;background:linear-gradient(180deg,rgba(3,7,19,.82),rgba(3,7,19,.66));box-shadow:0 18px 42px rgba(0,0,0,.34),0 0 22px rgba(73,236,255,.12);color:#fff;text-align:left;line-height:1.55}
    .judging-note strong{color:#f8d478;text-transform:uppercase;letter-spacing:.08em;font-size:.86rem;display:block;margin-bottom:6px}
    .judging-note p{margin:0;color:#e3d6ea;font-size:1rem;line-height:1.55}
    .judging-note p+p{margin-top:10px}
    .judging-note .important{color:#fff8e9;font-weight:850}
    @media(max-width:880px){.judging-note{padding:16px;margin-top:18px}.judging-note p{font-size:.95rem}}
  `;
  document.head.appendChild(style);

  document.querySelectorAll('a[href="#vote"]').forEach(a=>{if(/vote/i.test(a.textContent)) a.textContent='Fan Favorite Info'});
  const heroCopy=document.querySelector('.hero-copy');
  if(heroCopy){heroCopy.textContent='A high-energy, judge-selected bikini contest at Tailgate Beach Club at Mandalay Bay. Models can apply online for the opportunity to be featured and promoted before the event. Day-of-event submissions close at 1:00 PM, and the live event runs 2:00 PM–5:00 PM on August 15, 2026.';}
  const heroPanel=document.querySelector('.hero-copy-panel');
  if(heroPanel&&!document.querySelector('.judging-note.hero-judging-note')){
    const note=document.createElement('div');
    note.className='judging-note hero-judging-note';
    note.innerHTML='<strong>How Winners Are Selected</strong><p><span class="important">This is not a vote-based competition.</span> Overall winners will be selected by judges based on the official competition criteria, including stage presence, confidence, presentation, style, and overall contest performance.</p><p>A separate <span class="important">Fan Favorite</span> award includes a <span class="important">$2,500 Private Tailgate Cabana prize package</span> for the contestant who receives the most audience support.</p>';
    heroPanel.appendChild(note);
  }
  const contestLede=document.querySelector('#contest .section-lede');
  if(contestLede){contestLede.textContent='The EPIC Bikini Contest brings selected models to Tailgate Beach Club at Mandalay Bay on August 15, 2026 from 2:00 PM–5:00 PM. The overall winner will be selected by judges based on the competition criteria. Fan Favorite support is a separate audience-recognition feature with a $2,500 Private Tailgate Cabana prize package.';}
  const cards=[...document.querySelectorAll('#contest .card')];
  if(cards[1]){cards[1].querySelector('h3').textContent='Apply Online Or Register Day-Of';cards[1].querySelector('p').textContent='Models interested in participating can apply online for the opportunity to be featured and promoted prior to the event. Day-of-event submissions stop at 1:00 PM, and spots are limited.';}
  if(cards[2]){cards[2].querySelector('h3').textContent='Fan Favorite Cabana Prize';cards[2].querySelector('p').textContent='Audience support determines the separate Fan Favorite winner, who receives an additional $2,500 Private Tailgate Cabana prize package. Fan Favorite does not determine the overall contest winner.';}
  const voteHead=document.querySelector('#vote .showcase-head h2');
  if(voteHead) voteHead.textContent='Meet The Girls. Support Fan Favorite.';
  const voteIntro=document.querySelector('#vote .showcase-head p');
  if(voteIntro){voteIntro.textContent='Approved contestants will be posted here as numbered model cards. The display supports up to 100 girls, searchable cards, status filters, and Fan Favorite audience support. The contestant with the most Fan Favorite votes receives a $2,500 Private Tailgate Cabana prize package. Overall contest winners are selected by judges, not by votes.';}
  const modelNote=document.querySelector('.model-note');
  if(modelNote){modelNote.textContent='Fan Favorite support is for audience engagement and the separate $2,500 Private Tailgate Cabana prize package only. Final placement, prize eligibility, and official results are determined by EPIC Models & Talent contest rules, judging criteria, and event operations.';}
  const applyLede=document.querySelector('#models .section-lede');
  if(applyLede){applyLede.textContent='Models interested in participating can apply online for the opportunity to be featured and promoted prior to the event. Day-of-event submissions will be accepted until 1:00 PM on August 15, 2026; however, spots are limited, so early registration is encouraged.';}
  const photosCheck=document.querySelector('#models .checklist .check:nth-child(2)');
  if(photosCheck){photosCheck.innerHTML='<b>02 · 3–5 Images</b>Show your face, physique, style, and range.';}
  const postingCheck=document.querySelector('#models .checklist .check:nth-child(4)');
  if(postingCheck){postingCheck.innerHTML='<b>04 · Selection + Posting</b>Selected girls will be notified by email and may be posted on the main page and social channels before the live, judge-selected competition.';}
}

function getVotes(){try{return JSON.parse(localStorage.getItem(EPIC_MODEL_STORAGE)||'{}')}catch{return {}}}
function setVotes(v){localStorage.setItem(EPIC_MODEL_STORAGE,JSON.stringify(v))}
function hydrateModels(){const custom=Array.isArray(window.EPIC_APPROVED_MODELS)?window.EPIC_APPROVED_MODELS:starterModels;return custom.slice(0,EPIC_MODEL_LIMIT).map((m,i)=>({...m,number:m.number||i+1,id:m.id||`contestant-${String(i+1).padStart(3,'0')}`,votes:Number(m.votes||0)}))}
function renderModels(){const grid=document.querySelector('[data-model-grid]'),counter=document.querySelector('[data-model-counter]'),posted=document.querySelector('[data-model-posted]'),search=document.querySelector('[data-model-search]'),filter=document.querySelector('[data-model-filter]'),empty=document.querySelector('[data-model-empty]');if(!grid)return;const stored=getVotes();let models=hydrateModels().map(m=>({...m,votes:m.votes+(stored[m.id]||0)}));function draw(){const q=(search?.value||'').toLowerCase().trim();const f=filter?.value||'all';const filtered=models.filter(m=>(!q||`${m.name} ${m.city} ${m.status}`.toLowerCase().includes(q))&&(f==='all'||String(m.status).toLowerCase().includes(f)));grid.innerHTML=filtered.map(m=>`<article class="model-card" style="--model-photo:url('${m.photo}')" data-card><span class="model-number">#${String(m.number).padStart(3,'0')}</span><div class="model-photo" aria-hidden="true"></div><div class="model-content"><span class="model-tag">${m.status||'Selected'}</span><h3 class="model-name">${m.name}</h3><p class="model-meta">${m.city||'Las Vegas, NV'} · Fan Favorite support open</p><div class="vote-row"><button class="vote-btn" type="button" data-vote="${m.id}">Support Fan Favorite</button><span class="vote-count" data-count="${m.id}">${m.votes}</span></div></div></article>`).join('');if(counter)counter.textContent=String(Math.min(models.length,EPIC_MODEL_LIMIT));if(posted)posted.textContent=String(models.filter(m=>String(m.status||'selected').toLowerCase().includes('selected')).length);if(empty)empty.hidden=filtered.length!==0;requestAnimationFrame(()=>document.querySelectorAll('[data-card]').forEach((c,i)=>setTimeout(()=>c.classList.add('is-visible'),i*55)));}
grid.addEventListener('click',e=>{const btn=e.target.closest('[data-vote]');if(!btn)return;const id=btn.dataset.vote;const votes=getVotes();votes[id]=(votes[id]||0)+1;setVotes(votes);models=models.map(m=>m.id===id?{...m,votes:m.votes+1}:m);const count=document.querySelector(`[data-count="${id}"]`);if(count)count.textContent=String(models.find(m=>m.id===id)?.votes||0);btn.textContent='Support Counted';setTimeout(()=>btn.textContent='Support Fan Favorite',1100)});
search?.addEventListener('input',draw);filter?.addEventListener('change',draw);draw()}
document.addEventListener('DOMContentLoaded',()=>{insertHeroPrize();addHomepageEventUpdates();addJudgingAndRegistrationInfo();renderModels()});