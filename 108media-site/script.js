/* ============================================================
   108 MEDIA — interactions
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Preloader (index only) ---- */
  const pre = document.getElementById('preloader');
  if (pre) document.body.classList.add('no-scroll');
  window.addEventListener('load', () => {
    if (pre) {
      setTimeout(() => {
        pre.classList.add('done');
        document.body.classList.remove('no-scroll');
        kickHero();
      }, 1500);
    } else {
      kickHero();
    }
  });

  function kickHero() {
    document.querySelectorAll('.hero .reveal, .hero .reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('in'), 80 * i);
    });
  }

  /* ---- Year ---- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Nav: scroll behaviour ---- */
  const nav = document.getElementById('nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (y > lastY && y > 400) nav.classList.add('hidden');
    else nav.classList.remove('hidden');
    lastY = y;
  }, { passive: true });

  /* ---- Mobile menu ---- */
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.classList.toggle('no-scroll', open);
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }));

  /* ---- Scroll reveal ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .reveal-up').forEach(el => {
    if (!el.closest('.hero')) io.observe(el);
  });

  /* ---- Word-by-word statement ---- */
  const words = document.querySelectorAll('.reveal-word');
  if (words.length) {
    const wio = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = [...words].indexOf(e.target);
          setTimeout(() => e.target.classList.add('lit'), idx * 45);
          wio.unobserve(e.target);
        }
      });
    }, { threshold: 0.9 });
    words.forEach(w => wio.observe(w));
  }

  /* ---- Counters ---- */
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split('.')[1] || '').length;
      const dur = 1400; const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = decimals ? target.toFixed(decimals) : target;
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(c => cio.observe(c));

  if (prefersReduced) return; // skip motion flourishes

  /* ---- Scroll progress bar ---- */
  const progress = document.createElement('div');
  progress.className = 'progress';
  document.body.appendChild(progress);
  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    progress.style.transform = `scaleX(${max > 0 ? doc.scrollTop / max : 0})`;
  };
  updateProgress();
  window.addEventListener('scroll', updateProgress, { passive: true });

  /* ---- Scroll parallax for [data-parallax] ---- */
  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  let parTick = false;
  const updateParallax = () => {
    if (parTick) return; parTick = true;
    requestAnimationFrame(() => {
      const mid = window.innerHeight / 2;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.08;
        const r = el.getBoundingClientRect();
        const offset = (r.top + r.height / 2) - mid;
        el.style.setProperty('--py', `${(-offset * speed).toFixed(1)}px`);
      });
      parTick = false;
    });
  };
  if (parallaxEls.length) {
    updateParallax();
    window.addEventListener('scroll', updateParallax, { passive: true });
    window.addEventListener('resize', updateParallax);
  }

  /* ---- Subtle 3D tilt on work cards ---- */
  document.querySelectorAll('.work-card').forEach(card => {
    const media = card.querySelector('.work-card__media');
    if (!media) return;
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      media.style.transform = `translateY(-4px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => { media.style.transform = ''; });
  });

})();
