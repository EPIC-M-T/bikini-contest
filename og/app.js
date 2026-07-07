const nav = document.querySelector('#topNav');
const toggle = document.querySelector('.mobile-toggle');
const form = document.querySelector('#contestForm');
const toast = document.querySelector('#toast');
const overlay = document.querySelector('#heroGifOverlay');
const heroBadge = overlay?.closest('.hero-badge') || document.querySelector('.hero-badge');
const photos = document.querySelector('#photos');
const selected = document.querySelector('#selectedFiles');
const prize = document.querySelector('.hero-prize');
const cards = [...document.querySelectorAll('.asset-card')];
const SUBMISSION_URL = 'https://script.google.com/macros/s/AKfycbxVwGX70-fL-QM1nfKqlSyNdrh0hq_CFwBsKvwYgZ_AEbJL6oLufGXzLLqP6zGEtlCN/exec';

const modelCardBackFix = document.createElement('style');
modelCardBackFix.textContent = `.model-card-back{justify-content:flex-start!important;padding:1.35rem 1rem .85rem!important;background:linear-gradient(145deg,#21102c 0%,#090d18 58%,#03050c 100%)!important}.model-card-back:after{display:none!important;content:none!important}.model-card-back>*{position:relative!important;z-index:3!important}.model-card-back .model-info-number{display:block!important;margin:0 0 .34rem!important;padding:0!important;line-height:1.18!important;font-size:.68rem!important;letter-spacing:.18em!important;white-space:nowrap!important}.model-card-back h3{margin:0 0 .48rem!important;font-size:1.42rem!important;line-height:.95!important}.model-mini-facts{gap:.16rem!important}.model-mini-fact{padding:.17rem 0!important;border-bottom:1px solid rgba(255,255,255,.12)!important}.model-mini-fact span{font-size:.5rem!important;line-height:1.05!important}.model-mini-fact b{font-size:.67rem!important;line-height:1.08!important}.model-card-back-cta{margin-top:.5rem!important;padding:.48rem .65rem!important}.model-card-back:before{opacity:1!important}.model-card-front:after{display:block!important}`;
document.head.appendChild(modelCardBackFix);

if (overlay && heroBadge) heroBadge.classList.add('has-intro');

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.top-nav a, .footer a').forEach(anchor => {
  anchor.addEventListener('click', () => {
    nav?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
  });
});

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  setTimeout(() => toast.classList.remove('is-visible'), 5200);
}

function splitPair(value) {
  const parts = String(value || '').split('/').map(part => part.trim()).filter(Boolean);
  return [parts[0] || '', parts.slice(1).join(' / ') || ''];
}

function submissionId() {
  return 'web-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function imageToDataURL(file, maxSide = 1200, quality = .68) {
  if (!file || !file.type.startsWith('image/')) return readFileAsDataURL(file);
  const dataUrl = await readFileAsDataURL(file);
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

async function packFile(file) {
  if (!file) return null;
  return { name: file.name, type: file.type || 'application/octet-stream', dataUrl: await imageToDataURL(file) };
}

function shuffled(files) {
  const arr = [...(files || [])];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function postStage(data) {
  const payload = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => payload.append(key, typeof value === 'string' ? value : JSON.stringify(value)));
  await fetch(SUBMISSION_URL, { method: 'POST', mode: 'no-cors', body: payload });
}

async function uploadStage(id, role, file) {
  if (!file) return;
  const packed = await packFile(file);
  await postStage({ action: 'uploadImage', submissionId: id, role, file: packed });
}

photos?.addEventListener('change', () => {
  if (selected) selected.textContent = `${photos.files?.length || 0} images selected.`;
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (photos && (photos.files?.length || 0) < 6) {
    showToast('Please upload at least 6 images before submitting.');
    return;
  }

  const submitButton = form.querySelector('[type="submit"]');
  const id = submissionId();
  const locationParts = splitPair(document.querySelector('#location')?.value || '');
  const shoeDressParts = splitPair(document.querySelector('#shoeDress')?.value || '');
  const hairEyesParts = splitPair(document.querySelector('#hairEyes')?.value || '');
  const revealImages = shuffled(document.querySelector('#photos')?.files).slice(0, 2);

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Saving Info...';
    showToast('Saving contestant info...');

    await postStage({
      action: 'submitText',
      submissionId: id,
      name: document.querySelector('#name')?.value || '',
      age: document.querySelector('#age')?.value || '',
      email: document.querySelector('#email')?.value || '',
      phone: document.querySelector('#phone')?.value || '',
      instagram: document.querySelector('#instagram')?.value || '',
      city: locationParts[0],
      state: locationParts[1],
      height: document.querySelector('#height')?.value || '',
      measurements: document.querySelector('#measurements')?.value || '',
      shoeSize: shoeDressParts[0],
      dressSize: shoeDressParts[1],
      naturalHairColor: hairEyesParts[0],
      naturalEyeColor: hairEyesParts[1],
      agency: document.querySelector('#agency')?.value || '',
      portfolio: document.querySelector('#portfolio')?.value || '',
      notes: document.querySelector('#notes')?.value || '',
      sourcePage: location.href,
      userAgent: navigator.userAgent
    });

    submitButton.textContent = 'Uploading Headshot...';
    showToast('Uploading selected headshot...');
    await uploadStage(id, 'headshot', document.querySelector('#headshot')?.files?.[0]);

    submitButton.textContent = 'Uploading Reveal Images...';
    showToast('Uploading two random reveal images...');
    await uploadStage(id, 'reveal1', revealImages[0]);
    await uploadStage(id, 'reveal2', revealImages[1]);

    submitButton.textContent = 'Uploading Verification...';
    await uploadStage(id, 'id', document.querySelector('#idUpload')?.files?.[0]);
    await uploadStage(id, 'comp', document.querySelector('#compCardUpload')?.files?.[0]);

    submitButton.textContent = 'Finalizing...';
    showToast('Finalizing and sending your submission...');
    await postStage({ action: 'finalizeSubmission', submissionId: id });

    form.reset();
    if (selected) selected.textContent = '0 images selected.';
    showToast('Thank you! Your EPIC Bikini Contest submission has been sent for contestant review.');
  } catch (error) {
    console.error(error);
    showToast('Submission could not be sent. Please try again or email book@epicmodelsandtalent.com.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit For Consideration';
  }
});

function revealPrize() {
  prize?.classList.add('is-revealed');
}

addEventListener('load', () => {
  if (overlay) {
    heroBadge?.classList.remove('intro-complete');
    setTimeout(() => {
      overlay.classList.add('is-hidden');
      heroBadge?.classList.add('intro-complete');
    }, 7000);
    setTimeout(revealPrize, 7600);
  } else {
    heroBadge?.classList.add('intro-complete');
    setTimeout(revealPrize, 600);
  }
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .22, rootMargin: '0px 0px -8% 0px' });
  cards.forEach(card => observer.observe(card));
} else {
  cards.forEach(card => card.classList.add('is-visible'));
}

if (!document.querySelector('link[href="model-cards.css"]')) {
  const modelCardCss = document.createElement('link');
  modelCardCss.rel = 'stylesheet';
  modelCardCss.href = 'model-cards.css';
  document.head.appendChild(modelCardCss);
}

if (!document.querySelector('script[src="model-cards.js"]')) {
  const modelCardScript = document.createElement('script');
  modelCardScript.src = 'model-cards.js';
  modelCardScript.defer = true;
  document.body.appendChild(modelCardScript);
}
