const EPIC_APPLY_EVENT_START = '2026-08-15T14:00:00-07:00';
const EPIC_TEST_EMAILS = ['wsopamatt@gmail.com', 'traingthroughthepain36@gmail.com'];
let EPIC_SELECTED_PHOTOS = [];
let EPIC_SUBMITTING = false;

function epicApplyOgBackground(){
  if(document.getElementById('epicOgBgOverride')) return;
  const s=document.createElement('style');
  s.id='epicOgBgOverride';
  s.textContent = ".site:before{background:linear-gradient(180deg,rgba(0,0,0,.03),rgba(0,0,0,.25)),url('https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/6a62bfbc0e0316cbe00fa4b6.png')!important;background-size:cover!important;background-position:center top!important;opacity:1!important}.entry-countdown,.entry-prize-callout{margin:22px auto 0;padding:18px;border:1px solid rgba(73,236,255,.42);border-radius:24px;background:linear-gradient(135deg,rgba(3,7,19,.94),rgba(8,18,40,.78));box-shadow:0 22px 60px rgba(0,0,0,.42),0 0 28px rgba(73,236,255,.16)}.entry-countdown{width:min(900px,calc(100% - 24px))}.entry-countdown h2,.entry-prize-callout h3{margin:0;color:#fff8e9;font:950 clamp(1.65rem,3.4vw,3rem)/.98 Impact,Arial,sans-serif;text-transform:uppercase;letter-spacing:-.025em;text-shadow:0 5px 0 rgba(0,0,0,.44),0 0 22px rgba(255,57,200,.35)}.entry-countdown .entry-countdown-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.entry-countdown .time{padding:13px 10px;border-radius:18px;background:rgba(0,0,0,.46);border:1px solid rgba(255,255,255,.1);text-align:center}.entry-countdown .time strong{display:block;color:#f8d478;font:950 clamp(1.5rem,3.5vw,2.8rem)/.9 Impact,Arial,sans-serif}.entry-countdown .time span{display:block;margin-top:5px;color:#e3d6ea;text-transform:uppercase;letter-spacing:.12em;font-size:.66rem;font-weight:900}.entry-countdown p,.entry-prize-callout p{margin:8px 0 0;color:#fff8e9;line-height:1.5;font-weight:750}.entry-prize-callout{margin-bottom:18px;border-color:rgba(255,216,112,.46);background:linear-gradient(135deg,rgba(255,57,200,.18),rgba(73,236,255,.12)),rgba(3,7,19,.88)}.entry-prize-callout .prize-img{margin:0 0 14px;border-radius:18px;overflow:hidden;border:2px solid rgba(73,236,255,.55);background:#06080f}.entry-prize-callout img{width:100%;display:block}.entry-prize-callout strong{display:block;color:#49ecff;text-transform:uppercase;letter-spacing:.14em;font-size:.76rem}.queued-photo-panel{margin-top:10px;padding:12px;border:1px solid rgba(73,236,255,.28);border-radius:14px;background:rgba(0,0,0,.28)}.queued-photo-count{margin:0 0 8px;color:#fff8e9;font-weight:900}.queued-photo-list{display:flex;flex-wrap:wrap;gap:6px}.queued-photo-pill{padding:6px 8px;border-radius:999px;background:rgba(255,255,255,.08);color:#e3d6ea;font-size:12px}.clear-photos{margin-top:10px;min-height:34px;padding:0 12px;border:1px solid rgba(255,216,112,.36);border-radius:999px;background:rgba(0,0,0,.35);color:#fff8e9;font-weight:900;cursor:pointer}.submit[disabled]{opacity:.65;cursor:not-allowed}@media(max-width:700px){.entry-countdown .entry-countdown-grid{grid-template-columns:repeat(2,1fr)}.entry-countdown,.entry-prize-callout{padding:15px}.entry-prize-callout h3{font-size:clamp(1.45rem,8vw,2.25rem)}}@media(max-width:420px){.entry-countdown .entry-countdown-grid{grid-template-columns:1fr}}";
  document.head.appendChild(s);
}

function epicShow(message,isError){
  let toast=document.getElementById('epicFormToast');
  if(!toast){
    toast=document.createElement('div');
    toast.id='epicFormToast';
    toast.style.cssText='position:fixed;left:50%;bottom:18px;z-index:99999;transform:translateX(-50%);max-width:min(580px,calc(100vw - 28px));padding:14px 16px;border-radius:16px;background:rgba(3,7,19,.97);border:1px solid rgba(73,236,255,.7);color:#fff;text-align:center;box-shadow:0 16px 42px rgba(0,0,0,.45);font:800 14px/1.35 Arial,sans-serif';
    document.body.appendChild(toast);
  }
  toast.textContent=message;
  toast.style.borderColor=isError?'rgba(255,57,200,.75)':'rgba(73,236,255,.75)';
  clearTimeout(toast._timer);
  toast._timer=setTimeout(function(){ if(toast && toast.parentNode) toast.parentNode.removeChild(toast); }, isError?8000:5200);
}

function epicValue(id){ const el=document.getElementById(id); return el && el.value ? String(el.value).trim() : ''; }
function epicSafeFileName(file){ return (file && file.name ? file.name : 'upload').replace(/[^a-zA-Z0-9._-]+/g,'-'); }
function epicTestingEmailInfo(email){
  const original=String(email||'').trim().toLowerCase();
  if(EPIC_TEST_EMAILS.indexOf(original) === -1) return {email:original,originalEmail:original,isTestBypass:false};
  const parts=original.split('@');
  const stamp=new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
  return {email:parts[0]+'+test-'+stamp+'-'+Math.floor(Math.random()*100000)+'@'+parts[1],originalEmail:original,isTestBypass:true};
}

function epicFormatCountdown(ms){
  if(ms<=0) return {days:'00',hours:'00',minutes:'00',seconds:'00'};
  const total=Math.floor(ms/1000),days=Math.floor(total/86400),hours=Math.floor((total%86400)/3600),minutes=Math.floor((total%3600)/60),seconds=total%60;
  return {days:String(days),hours:String(hours).padStart(2,'0'),minutes:String(minutes).padStart(2,'0'),seconds:String(seconds).padStart(2,'0')};
}

function epicUpdateApplyHero(){
  const img=document.querySelector('.hero-logo-mark img');
  if(img){img.src='https://assets.cdn.filesafe.space/YzjwmP6zpvDUp28hrM1o/media/6a6273fe2e0540011f4e64e7.webp';img.alt='EPIC Bikini Contest at Tailgate Beach Club';}
}

function epicUpdatePhotoRequirementText(){
  document.querySelectorAll('li,label,.hint,p').forEach(function(el){
    if(el.childElementCount===0){
      el.textContent=el.textContent.replace(/6\s*[–-]\s*10/g,'3–5').replace(/at least 6/gi,'3 to 5').replace(/August 14th 2026|August 14, 2026|August 14th/gi,'August 15th 2026');
    }
  });
  ['photos','idUpload','headshot','compCardUpload'].forEach(function(id){
    const input=document.getElementById(id);
    if(input) input.removeAttribute('required');
  });
}

function epicInsertEntryCountdown(){
  const hero=document.querySelector('.hero');
  if(!hero || document.querySelector('.entry-countdown')) return;
  const box=document.createElement('section');
  box.className='entry-countdown';
  box.innerHTML='<p class="kicker">Bikini Contest Countdown</p><h2>August 15, 2026 · 2PM–5PM</h2><div class="entry-countdown-grid"><div class="time"><strong data-days>00</strong><span>Days</span></div><div class="time"><strong data-hours>00</strong><span>Hours</span></div><div class="time"><strong data-minutes>00</strong><span>Minutes</span></div><div class="time"><strong data-seconds>00</strong><span>Seconds</span></div></div><p>Day-of-event submissions stop at 1:00 PM. Early submission is strongly encouraged because spots are limited.</p>';
  hero.insertAdjacentElement('afterend',box);
  const update=function(){const t=epicFormatCountdown(new Date(EPIC_APPLY_EVENT_START).getTime()-Date.now());box.querySelector('[data-days]').textContent=t.days;box.querySelector('[data-hours]').textContent=t.hours;box.querySelector('[data-minutes]').textContent=t.minutes;box.querySelector('[data-seconds]').textContent=t.seconds;};
  update(); setInterval(update,1000);
}

function epicUpdateEventDetails(){
  const date=document.querySelector('.event-date');
  if(date) date.innerHTML='August 15th <span class="year">2026</span>';
  const lede=document.querySelector('.hero-copy .lede');
  if(lede) lede.textContent='Submit your materials for a chance to be included among up to 100 girls posted for the EPIC Bikini Contest at Tailgate Beach Club at Mandalay Bay on August 15th 2026 from 2:00 PM–5:00 PM. Day-of-event submissions stop at 1:00 PM. If selected, you’ll be notified by email and may be posted on the main contest page and social channels for fan voting. Contestants must be 21+ to participate.';
}

function epicInsertPrizeCallout(){
  const form=document.getElementById('form');
  if(!form || document.querySelector('.entry-prize-callout')) return;
  const block=document.createElement('div');
  block.className='entry-prize-callout';
  block.innerHTML='<div class="prize-img"><img src="assets/Prize-pool.webp" alt="Prize pool: first place $10,000, second place $5,000, third place $2,500."></div><strong>Fan Favorite Prize Package</strong><h3>$2,500 Private Tailgate Cabana</h3><p>The contestant who receives the most Fan Favorite votes will receive an additional $2,500 Private Tailgate Cabana prize package. Overall contest winners are selected by judges; Fan Favorite is a separate audience-vote award.</p>';
  form.insertAdjacentElement('afterbegin',block);
}

function epicSetupPhotoQueue(){
  const input=document.getElementById('photos');
  if(!input || document.getElementById('queuedPhotoPanel')) return;
  const panel=document.createElement('div');
  panel.id='queuedPhotoPanel';
  panel.className='queued-photo-panel';
  panel.innerHTML='<p class="queued-photo-count">Selected images: <span data-photo-count>0</span>/5</p><div class="queued-photo-list" data-photo-list></div><button class="clear-photos" type="button">Clear selected images</button>';
  const upload=input.closest ? input.closest('.upload') : input.parentNode;
  if(upload) upload.appendChild(panel);
  const refresh=function(){
    panel.querySelector('[data-photo-count]').textContent=String(EPIC_SELECTED_PHOTOS.length);
    panel.querySelector('[data-photo-list]').innerHTML=EPIC_SELECTED_PHOTOS.map(function(f,i){return '<span class="queued-photo-pill">'+(i+1)+'. '+epicSafeFileName(f)+'</span>';}).join('') || '<span class="queued-photo-pill">No images selected yet</span>';
  };
  input.addEventListener('change',function(){
    const next=Array.prototype.slice.call(input.files || []);
    next.forEach(function(f){
      if(EPIC_SELECTED_PHOTOS.length>=5) return;
      const key=(f.name||'')+'|'+(f.size||0)+'|'+(f.lastModified||0);
      const exists=EPIC_SELECTED_PHOTOS.some(function(x){return ((x.name||'')+'|'+(x.size||0)+'|'+(x.lastModified||0))===key;});
      if(!exists) EPIC_SELECTED_PHOTOS.push(f);
    });
    try{ input.value=''; }catch(e){}
    if(EPIC_SELECTED_PHOTOS.length>=5) epicShow('You have selected the maximum of 5 images.',false);
    refresh();
  });
  panel.querySelector('.clear-photos').addEventListener('click',function(){ EPIC_SELECTED_PHOTOS=[]; try{input.value='';}catch(e){} refresh(); });
  refresh();
}

function epicReadFileAsDataUrl(file){
  return new Promise(function(resolve,reject){
    const reader=new FileReader();
    reader.onload=function(){ resolve(String(reader.result||'')); };
    reader.onerror=function(){ reject(reader.error || new Error('File read failed')); };
    reader.readAsDataURL(file);
  });
}

function epicImageToCompressedPayload(file, maxSide, quality){
  return new Promise(function(resolve){
    if(!file || !/^image\//i.test(file.type||'')){
      epicReadFileAsDataUrl(file).then(function(dataUrl){resolve({name:epicSafeFileName(file),type:file && file.type || 'application/octet-stream',size:file && file.size || 0,dataUrl:dataUrl});}).catch(function(){resolve(null);});
      return;
    }
    const reader=new FileReader();
    reader.onload=function(){
      const img=new Image();
      img.onload=function(){
        try{
          const scale=Math.min(1, maxSide / Math.max(img.width,img.height));
          const w=Math.max(1,Math.round(img.width*scale));
          const h=Math.max(1,Math.round(img.height*scale));
          const canvas=document.createElement('canvas');
          canvas.width=w; canvas.height=h;
          canvas.getContext('2d').drawImage(img,0,0,w,h);
          const dataUrl=canvas.toDataURL('image/jpeg',quality);
          resolve({name:epicSafeFileName(file).replace(/\.[^.]+$/,'')+'.jpg',type:'image/jpeg',size:file.size||0,dataUrl:dataUrl});
        }catch(e){
          resolve({name:epicSafeFileName(file),type:file.type||'image/jpeg',size:file.size||0,dataUrl:String(reader.result||'')});
        }
      };
      img.onerror=function(){resolve({name:epicSafeFileName(file),type:file.type||'image/jpeg',size:file.size||0,dataUrl:String(reader.result||'')});};
      img.src=String(reader.result||'');
    };
    reader.onerror=function(){resolve(null);};
    reader.readAsDataURL(file);
  });
}

async function epicFileInputPayload(id, maxSide){
  const input=document.getElementById(id);
  const files=Array.prototype.slice.call(input && input.files || []);
  const out=[];
  for(let i=0;i<files.length;i++){
    const payload=await epicImageToCompressedPayload(files[i], maxSide || 1200, .74);
    if(payload) out.push(payload);
  }
  return out;
}

async function epicQueuedPhotoPayloads(){
  const out=[];
  for(let i=0;i<EPIC_SELECTED_PHOTOS.length;i++){
    const payload=await epicImageToCompressedPayload(EPIC_SELECTED_PHOTOS[i], 1200, .72);
    if(payload) out.push(payload);
  }
  return out;
}

function epicValidateForm(){
  const name=epicValue('name'), age=Number(epicValue('age')), email=epicValue('email');
  if(!name){ epicShow('Please enter your full name.',true); return false; }
  if(!age || age<21){ epicShow('Contestants must be 21+. Please enter a valid age.',true); return false; }
  if(!email || email.indexOf('@')<1){ epicShow('Please enter a valid email address.',true); return false; }
  const idFile=document.getElementById('idUpload');
  const headshot=document.getElementById('headshot');
  if(!idFile || !idFile.files || !idFile.files.length){ epicShow('Please upload your ID before submitting.',true); return false; }
  if(!headshot || !headshot.files || !headshot.files.length){ epicShow('Please upload your preferred headshot before submitting.',true); return false; }
  if(EPIC_SELECTED_PHOTOS.length<3 || EPIC_SELECTED_PHOTOS.length>5){ epicShow('Please upload 3 to 5 images before submitting. You can add them one at a time.',true); return false; }
  const agree=document.getElementById('agree');
  if(agree && !agree.checked){ epicShow('Please agree to the Terms and Privacy Policy before submitting.',true); return false; }
  return true;
}

async function epicBuildPayload(){
  const emailInfo=epicTestingEmailInfo(epicValue('email'));
  const fullName=epicValue('name'), age=epicValue('age'), phone=epicValue('phone'), instagram=epicValue('instagram'), cityState=epicValue('location'), height=epicValue('height'), measurements=epicValue('measurements'), shoeDressSize=epicValue('shoeDress'), hairEyeColor=epicValue('hairEyes'), portfolio=epicValue('portfolio'), notes=epicValue('notes');
  epicShow('Preparing images. Please keep this page open...',false);
  const idUpload=await epicFileInputPayload('idUpload',1000);
  const preferredHeadshot=await epicFileInputPayload('headshot',1200);
  const images=await epicQueuedPhotoPayloads();
  const optionalCompCard=await epicFileInputPayload('compCardUpload',1200);
  return {source:'EPIC Bikini Contest current apply page',sourceUrl:location.href,submittedAt:new Date().toISOString(),contest:'EPIC Bikini Contest',submissionType:'Model Entry',type:'model_entry',action:'submit',venue:'Tailgate Beach Club at Mandalay Bay',eventDate:'August 15, 2026',eventTime:'2:00 PM - 5:00 PM',dayOfSubmissionDeadline:'1:00 PM on August 15, 2026',fullName:fullName,name:fullName,age:age,email:emailInfo.email,normalizedEmail:emailInfo.email,originalEmail:emailInfo.originalEmail,testDuplicateBypass:emailInfo.isTestBypass,phone:phone,instagram:instagram,igHandle:instagram,cityState:cityState,location:cityState,city:cityState,state:'',height:height,measurements:measurements,shoeDressSize:shoeDressSize,shoeDress:shoeDressSize,hairEyeColor:hairEyeColor,hairEyes:hairEyeColor,portfolio:portfolio,portfolioLink:portfolio,notes:notes,selectionNotes:'Up to 100 girls may be selected, posted on the main contest page/social channels, and included in Fan Favorite audience support. Selected applicants will be notified by email. Overall contest winners are selected by judges, not votes. The Fan Favorite winner receives a $2,500 Private Tailgate Cabana prize package.',requirements:'Contestants must be 21+ and bring valid ID if chosen. Photo submission requirement is 3 to 5 images.',fields:{fullName:fullName,name:fullName,age:age,email:emailInfo.email,originalEmail:emailInfo.originalEmail,testDuplicateBypass:emailInfo.isTestBypass,phone:phone,instagram:instagram,igHandle:instagram,cityState:cityState,location:cityState,city:cityState,state:'',height:height,measurements:measurements,shoeDressSize:shoeDressSize,shoeDress:shoeDressSize,hairEyeColor:hairEyeColor,hairEyes:hairEyeColor,portfolio:portfolio,portfolioLink:portfolio,notes:notes},idUpload:idUpload,uploadId:idUpload,verificationFile:idUpload,preferredHeadshot:preferredHeadshot,headshot:preferredHeadshot,images:images,photos:images,cardImages:images,revealImages:images,additionalImages:images,optionalCompCard:optionalCompCard,compCardUpload:optionalCompCard,compCard:optionalCompCard,uploads:{idUpload:idUpload,uploadId:idUpload,verificationFile:idUpload,preferredHeadshot:preferredHeadshot,headshot:preferredHeadshot,images:images,photos:images,cardImages:images,revealImages:images,additionalImages:images,optionalCompCard:optionalCompCard,compCardUpload:optionalCompCard,compCard:optionalCompCard}};
}

function epicParamsFromPayload(payload){
  const params=new URLSearchParams();
  const add=function(k,v){ params.append(k, v==null ? '' : String(v)); };
  add('payload',JSON.stringify(payload)); add('data',JSON.stringify(payload)); add('json',JSON.stringify(payload));
  ['source','sourceUrl','submittedAt','contest','submissionType','type','action','venue','eventDate','eventTime','dayOfSubmissionDeadline','fullName','name','age','email','normalizedEmail','originalEmail','phone','instagram','igHandle','cityState','location','city','state','height','measurements','shoeDressSize','shoeDress','hairEyeColor','hairEyes','portfolio','portfolioLink','notes'].forEach(function(k){add(k,payload[k]);});
  add('testDuplicateBypass',String(!!payload.testDuplicateBypass));
  add('idUpload',JSON.stringify(payload.idUpload||[])); add('uploadId',JSON.stringify(payload.idUpload||[])); add('verificationFile',JSON.stringify(payload.idUpload||[]));
  add('preferredHeadshot',JSON.stringify(payload.preferredHeadshot||[])); add('headshot',JSON.stringify(payload.preferredHeadshot||[]));
  add('images',JSON.stringify(payload.images||[])); add('photos',JSON.stringify(payload.images||[])); add('cardImages',JSON.stringify(payload.images||[])); add('revealImages',JSON.stringify(payload.images||[])); add('additionalImages',JSON.stringify(payload.images||[]));
  add('optionalCompCard',JSON.stringify(payload.optionalCompCard||[])); add('compCardUpload',JSON.stringify(payload.optionalCompCard||[])); add('compCard',JSON.stringify(payload.optionalCompCard||[]));
  return params;
}

async function epicSubmitToAppsScript(form){
  if(EPIC_SUBMITTING) return;
  if(!epicValidateForm()) return;
  const endpoint=window.EPIC_APPS_SCRIPT_URL;
  if(!endpoint){ epicShow('Submission handler is not connected yet. Please contact EPIC Models & Talent.',true); return; }
  const submit=form.querySelector('[type="submit"]');
  EPIC_SUBMITTING=true;
  if(submit){ submit.disabled=true; submit.dataset.originalText=submit.textContent; submit.textContent='Submitting...'; }
  try{
    const payload=await epicBuildPayload();
    epicShow('Submitting your entry. Please do not close this page...',false);
    await fetch(endpoint,{method:'POST',body:epicParamsFromPayload(payload),mode:'no-cors',keepalive:false});
    form.reset();
    EPIC_SELECTED_PHOTOS=[];
    const count=document.querySelector('[data-photo-count]'), list=document.querySelector('[data-photo-list]');
    if(count) count.textContent='0';
    if(list) list.innerHTML='<span class="queued-photo-pill">No images selected yet</span>';
    epicShow('Thank you. Your EPIC Bikini Contest submission has been received for contestant review.');
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(err){
    console.error(err);
    epicShow('Your entry did not send. Please try again with slightly smaller image files, or contact EPIC Models & Talent.',true);
  }finally{
    EPIC_SUBMITTING=false;
    if(submit){ submit.disabled=false; submit.textContent=submit.dataset.originalText || 'Submit For Consideration'; }
  }
}

function epicHardBlockNativeSubmit(){
  document.addEventListener('submit',function(e){
    const form=e.target;
    if(form && form.id==='form'){
      e.preventDefault();
      e.stopPropagation();
      epicSubmitToAppsScript(form);
      return false;
    }
  },true);
}

function epicInitApplyForm(){
  epicApplyOgBackground();
  epicUpdateApplyHero();
  epicUpdateEventDetails();
  epicUpdatePhotoRequirementText();
  epicInsertEntryCountdown();
  epicInsertPrizeCallout();
  epicSetupPhotoQueue();
  const form=document.getElementById('form');
  if(form){
    form.setAttribute('action','javascript:void(0)');
    form.setAttribute('method','post');
    form.setAttribute('novalidate','novalidate');
    form.onsubmit=function(e){ if(e){e.preventDefault();e.stopPropagation();} epicSubmitToAppsScript(form); return false; };
  }
}

epicHardBlockNativeSubmit();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',epicInitApplyForm); else epicInitApplyForm();