// Shared site behavior — loaded on every page.
const CALENDLY_URL = 'https://calendly.com/shr-abinash1801/30min';

// Sticky nav background on scroll
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Mobile drawer
const drawer = document.getElementById('drawer');
const menuBtn = document.getElementById('menuBtn');
const closeBtn = document.getElementById('closeBtn');
if (drawer && menuBtn && closeBtn) {
  const setDrawer = (open) => {
    drawer.classList.toggle('open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    menuBtn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setDrawer(true));
  closeBtn.addEventListener('click', () => setDrawer(false));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setDrawer(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });
}

// Calendly popup — open the scheduler over the page; the href is a working
// fallback (opens Calendly directly) if the widget script fails to load.
document.querySelectorAll('.js-calendly').forEach(el => {
  el.addEventListener('click', (e) => {
    if (window.Calendly && typeof window.Calendly.initPopupWidget === 'function') {
      e.preventDefault();
      window.Calendly.initPopupWidget({ url: CALENDLY_URL });
    }
  });
});

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = (Math.min(i % 4, 3) * 70) + 'ms';
  io.observe(el);
});
