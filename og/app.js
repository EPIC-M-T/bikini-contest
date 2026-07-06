const nav = document.querySelector('#topNav');
const toggle = document.querySelector('.mobile-toggle');
const form = document.querySelector('#contestForm');
const toast = document.querySelector('#toast');
const overlay = document.querySelector('#heroGifOverlay');
const heroBadge = overlay?.closest('.hero-badge');
const photos = document.querySelector('#photos');
const selected = document.querySelector('#selectedFiles');
const prize = document.querySelector('.hero-prize');
const cards = [...document.querySelectorAll('.asset-card')];

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
  setTimeout(() => toast.classList.remove('is-visible'), 3400);
}

photos?.addEventListener('change', () => {
  if (selected) selected.textContent = `${photos.files?.length || 0} images selected.`;
});

form?.addEventListener('submit', event => {
  event.preventDefault();
  if (photos && (photos.files?.length || 0) < 6) {
    showToast('Please upload at least 6 images before submitting.');
    return;
  }
  showToast('Thank you! Your EPIC Bikini Contest submission has been received for contestant review.');
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
