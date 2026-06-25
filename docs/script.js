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

// Netlify form AJAX submit — posts without a page reload, then reveals a
// success message. Works for the contact, newsletter, and assessment forms.
document.querySelectorAll('form.js-netlify').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('[type=submit]');
    if (submitBtn) { submitBtn.disabled = true; }
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      });
    } catch (_) { /* offline / local preview — still show success */ }
    const successSel = form.getAttribute('data-success');
    const target = successSel && document.querySelector(successSel);
    if (target) {
      form.classList.add('is-hidden');
      target.classList.remove('is-hidden');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      form.innerHTML = '<p style="padding:1rem 0;color:var(--ink-soft);">Thank you — your message has been received. Amit will be in touch within 24 hours.</p>';
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

// ============================================================
// CMS content: progressively replace seed sections with the
// CMS-managed versions (docs/data/*.json edited via /admin).
// The seed HTML stays in the page for SEO + no-JS robustness;
// this only overrides it when the JSON loads successfully.
// ============================================================
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
async function loadJSON(path){ try { const r = await fetch(path, { cache: 'no-cache' }); if (!r.ok) return null; return await r.json(); } catch (_) { return null; } }

(async () => {
  // Events
  const ev = document.getElementById('events-list');
  if (ev) {
    const d = await loadJSON('data/events.json');
    if (d && Array.isArray(d.events) && d.events.length) {
      ev.innerHTML = d.events.map(e => `
      <article class="event">
        <div class="event-date"><div class="m">${esc(e.month)}</div><div class="d">${esc(e.day)}</div><div class="y">${esc(e.year)}</div></div>
        <div>
          <div class="tag">${esc(e.type)}</div>
          <h3>${esc(e.title)}</h3>
          <div class="ev-meta">${(e.meta||[]).map(m => `<span>${esc(m)}</span>`).join('')}</div>
        </div>
        <div class="go"><a href="${esc(e.link||'consultation.html')}">${esc(e.cta||'Reserve a Spot →')}</a></div>
      </article>`).join('');
    }
  }
  // Testimonials
  const tg = document.getElementById('testimonials-grid');
  if (tg) {
    const d = await loadJSON('data/testimonials.json');
    if (d && Array.isArray(d.testimonials) && d.testimonials.length) {
      tg.innerHTML = d.testimonials.map(t => `
      <figure class="tst">
        <div class="q" aria-hidden="true">“</div>
        <blockquote>${esc(t.quote)}</blockquote>
        <figcaption class="who"><b>${esc(t.name)}</b><span>${esc(t.role)}</span></figcaption>
      </figure>`).join('');
    }
  }
  // Insights essays
  const eg = document.getElementById('essays-grid');
  if (eg) {
    const d = await loadJSON('data/essays.json');
    if (d && Array.isArray(d.essays) && d.essays.length) {
      eg.innerHTML = d.essays.map(a => `
      <article class="essay">
        <span class="cat">${esc(a.category)}</span>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.excerpt)}</p>
        <span class="read">${esc(a.read)}</span>
      </article>`).join('');
    }
  }
})();

// Page text: replace any element tagged data-edit with its CMS value (if set).
(async () => {
  const els = document.querySelectorAll('[data-edit]');
  if (!els.length) return;
  const d = await loadJSON('data/pages.json');
  if (!d) return;
  els.forEach(el => {
    const k = el.getAttribute('data-edit');
    if (d[k] != null && String(d[k]).trim() !== '') el.innerHTML = d[k];
  });
})();
