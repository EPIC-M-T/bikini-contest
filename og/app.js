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
  setTimeout(() => toast.classList.remove('is-visible'), 4200);
}

function splitPair(value) {
  const parts = String(value || '').split('/').map(part => part.trim()).filter(Boolean);
  return [parts[0] || '', parts.slice(1).join(' / ') || ''];
}

function fileNames(input) {
  return [...(input?.files || [])].map(file => file.name).join(', ');
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
  const locationParts = splitPair(document.querySelector('#location')?.value || '');
  const shoeDressParts = splitPair(document.querySelector('#shoeDress')?.value || '');
  const hairEyesParts = splitPair(document.querySelector('#hairEyes')?.value || '');
  const payload = new FormData();

  payload.append('name', document.querySelector('#name')?.value || '');
  payload.append('age', document.querySelector('#age')?.value || '');
  payload.append('email', document.querySelector('#email')?.value || '');
  payload.append('phone', document.querySelector('#phone')?.value || '');
  payload.append('instagram', document.querySelector('#instagram')?.value || '');
  payload.append('city', locationParts[0]);
  payload.append('state', locationParts[1]);
  payload.append('height', document.querySelector('#height')?.value || '');
  payload.append('measurements', document.querySelector('#measurements')?.value || '');
  payload.append('shoeSize', shoeDressParts[0]);
  payload.append('dressSize', shoeDressParts[1]);
  payload.append('naturalHairColor', hairEyesParts[0]);
  payload.append('naturalEyeColor', hairEyesParts[1]);
  payload.append('agency', document.querySelector('#agency')?.value || '');
  payload.append('portfolio', document.querySelector('#portfolio')?.value || '');
  payload.append('notes', document.querySelector('#notes')?.value || '');
  payload.append('sourcePage', location.href);
  payload.append('userAgent', navigator.userAgent);
  payload.append('idUrl', fileNames(document.querySelector('#idUpload')));
  payload.append('headshotUrl', fileNames(document.querySelector('#headshot')));
  payload.append('additionalImageUrls', fileNames(document.querySelector('#photos')));
  payload.append('compCardUrl', fileNames(document.querySelector('#compCardUpload')));

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    await fetch(SUBMISSION_URL, { method: 'POST', mode: 'no-cors', body: payload });
    form.reset();
    if (selected) selected.textContent = '0 images selected.';
    showToast('Thank you! Your EPIC Bikini Contest submission has been sent for contestant review.');
  } catch (error) {
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
