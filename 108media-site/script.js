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

  if (prefersReduced) return; // skip pointer-driven flourishes

  /* ---- Custom cursor ---- */
  const cursor = document.getElementById('cursor');
  const dot = document.getElementById('cursorDot');
  let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
  let dx = cx, dy = cy;
  window.addEventListener('mousemove', (e) => {
    dx = e.clientX; dy = e.clientY;
    dot.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  (function loop() {
    cx += (dx - cx) * 0.18; cy += (dy - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('[data-cursor]').forEach(el => {
    const type = el.getAttribute('data-cursor');
    el.addEventListener('mouseenter', () => cursor.classList.add(type === 'view' ? 'is-view' : 'is-hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('is-view', 'is-hover'));
  });

  /* ---- Parallax orbs ---- */
  const orbs = document.querySelectorAll('.orb');
  window.addEventListener('mousemove', (e) => {
    const mx = (e.clientX / window.innerWidth - 0.5);
    const my = (e.clientY / window.innerHeight - 0.5);
    orbs.forEach((o, i) => {
      const f = (i + 1) * 16;
      o.style.transform = `translate(${mx * f}px, ${my * f}px)`;
    });
  });
  // gentle drift on scroll
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    orbs.forEach((o, i) => { o.style.marginTop = `${y * 0.04 * (i + 1)}px`; });
  }, { passive: true });

  /* ---- Magnetic buttons ---- */
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

})();
