const EPIC_MODEL_LIMIT=100;
const EPIC_MODEL_STORAGE='epic-bikini-contest-votes-v1';
const starterModels=[];

function insertHeroPrize(){
  const heroArt=document.querySelector('.hero-art');
  if(!heroArt||document.querySelector('.hero-prize-under'))return;
  const prize=document.createElement('figure');
  prize.className='hero-prize-under';
  prize.innerHTML='<img src="assets/Prize-pool.webp" alt="Prize Pool graphic showing first place $10,000, second place $5,000, and third place $2,500.">';
  heroArt.insertAdjacentElement('afterend',prize);
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

  document.querySelectorAll('a[href="#vote"]').forEach(a=>{
    if(/vote/i.test(a.textContent)) a.textContent='Fan Favorite Info';
  });

  const heroCopy=document.querySelector('.hero-copy');
  if(heroCopy){
    heroCopy.textContent='A high-energy, judge-selected bikini contest at Tailgate Beach Club at Mandalay Bay. Models can apply online for the opportunity to be featured and promoted before the event, with limited in-person registration also available on event day.';
  }

  const facts=[...document.querySelectorAll('.quick-facts .fact')];
  if(facts[2]) facts[2].innerHTML='<strong>Judged</strong><span>Fan Favorite Separate</span>';

  const heroPanel=document.querySelector('.hero-copy-panel');
  if(heroPanel&&!document.querySelector('.judging-note.hero-judging-note')){
    const note=document.createElement('div');
    note.className='judging-note hero-judging-note';
    note.innerHTML='<strong>How Winners Are Selected</strong><p><span class="important">This is not a vote-based competition.</span> Overall winners will be selected by judges based on the official competition criteria, including stage presence, confidence, presentation, style, and overall contest performance.</p><p>A separate <span class="important">Fan Favorite</span> recognition may be awarded to the contestant who receives the most audience support, but winning Fan Favorite does not necessarily mean that contestant will win the overall competition.</p>';
    heroPanel.appendChild(note);
  }

  const contestLede=document.querySelector('#contest .section-lede');
  if(contestLede){
    contestLede.textContent='The EPIC Bikini Contest brings selected models to Tailgate Beach Club at Mandalay Bay for a live Swim Week competition. The overall winner will be selected by judges based on the competition criteria. Fan Favorite support may be included as a separate audience-recognition feature only.';
  }

  const cards=[...document.querySelectorAll('#contest .card')];
  if(cards[1]){
    cards[1].querySelector('h3').textContent='Apply Online Or Register Day-Of';
    cards[1].querySelector('p').textContent='Models interested in participating can apply online for the opportunity to be featured and promoted prior to the event. In-person registration will also be available on event day, but spots are limited, so early registration is encouraged.';
  }
  if(cards[2]){
    cards[2].querySelector('h3').textContent='Fan Favorite Recognition';
    cards[2].querySelector('p').textContent='Audience support can be used for a separate Fan Favorite award. Fan Favorite does not determine the overall contest winner or replace judge scoring.';
  }

  const voteHead=document.querySelector('#vote .showcase-head h2');
  if(voteHead) voteHead.textContent='Meet The Girls. Support Fan Favorite.';
  const voteIntro=document.querySelector('#vote .showcase-head p');
  if(voteIntro){
    voteIntro.textContent='Approved contestants will be posted here as numbered model cards. The display supports up to 100 girls, searchable cards, status filters, and Fan Favorite audience support. Overall contest winners are selected by judges, not by votes.';
  }
  const modelNote=document.querySelector('.model-note');
  if(modelNote){
    modelNote.textContent='Fan Favorite support is for audience engagement and separate recognition only. Final placement, prize eligibility, and official results are determined by EPIC Models & Talent contest rules, judging criteria, and event operations.';
  }

  const applyLede=document.querySelector('#models .section-lede');
  if(applyLede){
    applyLede.textContent='Models interested in participating can apply online for the opportunity to be featured and promoted prior to the event. In-person registration will also be available on the day of the event; however, spots are limited, so early registration is encouraged to secure a spot in the competition.';
  }
  const photosCheck=document.querySelector('#models .checklist .check:nth-child(2)');
  if(photosCheck){
    photosCheck.innerHTML='<b>02 · 3–5 Images</b>Show your face, physique, style, and range.';
  }
  const postingCheck=document.querySelector('#models .checklist .check:nth-child(4)');
  if(postingCheck){
    postingCheck.innerHTML='<b>04 · Selection + Posting</b>Selected girls will be notified by email and may be posted on the main page and social channels before the live, judge-selected competition.';
  }
}

function getVotes(){try{return JSON.parse(localStorage.getItem(EPIC_MODEL_STORAGE)||'{}')}catch{return {}}}
function setVotes(v){localStorage.setItem(EPIC_MODEL_STORAGE,JSON.stringify(v))}
function hydrateModels(){const custom=Array.isArray(window.EPIC_APPROVED_MODELS)?window.EPIC_APPROVED_MODELS:starterModels;return custom.slice(0,EPIC_MODEL_LIMIT).map((m,i)=>({...m,number:m.number||i+1,id:m.id||`contestant-${String(i+1).padStart(3,'0')}`,votes:Number(m.votes||0)}))}
function renderModels(){const grid=document.querySelector('[data-model-grid]'),counter=document.querySelector('[data-model-counter]'),posted=document.querySelector('[data-model-posted]'),search=document.querySelector('[data-model-search]'),filter=document.querySelector('[data-model-filter]'),empty=document.querySelector('[data-model-empty]');if(!grid)return;const stored=getVotes();let models=hydrateModels().map(m=>({...m,votes:m.votes+(stored[m.id]||0)}));function draw(){const q=(search?.value||'').toLowerCase().trim();const f=filter?.value||'all';const filtered=models.filter(m=>(!q||`${m.name} ${m.city} ${m.status}`.toLowerCase().includes(q))&&(f==='all'||String(m.status).toLowerCase().includes(f)));grid.innerHTML=filtered.map(m=>`<article class="model-card" style="--model-photo:url('${m.photo}')" data-card><span class="model-number">#${String(m.number).padStart(3,'0')}</span><div class="model-photo" aria-hidden="true"></div><div class="model-content"><span class="model-tag">${m.status||'Selected'}</span><h3 class="model-name">${m.name}</h3><p class="model-meta">${m.city||'Las Vegas, NV'} · Fan Favorite support open</p><div class="vote-row"><button class="vote-btn" type="button" data-vote="${m.id}">Support Fan Favorite</button><span class="vote-count" data-count="${m.id}">${m.votes}</span></div></div></article>`).join('');if(counter)counter.textContent=String(Math.min(models.length,EPIC_MODEL_LIMIT));if(posted)posted.textContent=String(models.filter(m=>String(m.status||'selected').toLowerCase().includes('selected')).length);if(empty)empty.hidden=filtered.length!==0;requestAnimationFrame(()=>document.querySelectorAll('[data-card]').forEach((c,i)=>setTimeout(()=>c.classList.add('is-visible'),i*55)));}
grid.addEventListener('click',e=>{const btn=e.target.closest('[data-vote]');if(!btn)return;const id=btn.dataset.vote;const votes=getVotes();votes[id]=(votes[id]||0)+1;setVotes(votes);models=models.map(m=>m.id===id?{...m,votes:m.votes+1}:m);const count=document.querySelector(`[data-count="${id}"]`);if(count)count.textContent=String(models.find(m=>m.id===id)?.votes||0);btn.textContent='Support Counted';setTimeout(()=>btn.textContent='Support Fan Favorite',1100)});
search?.addEventListener('input',draw);filter?.addEventListener('change',draw);draw()}
document.addEventListener('DOMContentLoaded',()=>{insertHeroPrize();addJudgingAndRegistrationInfo();renderModels()});