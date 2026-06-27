/* ============================================================
   108 MEDIA — Case study interactions
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Section dot-nav (scroll-spy) ===== */
  const dots = [...document.querySelectorAll('.dotnav__dot')];
  const navSections = dots.map(d => document.getElementById(d.dataset.target)).filter(Boolean);
  dots.forEach(d => d.addEventListener('click', () => {
    const el = document.getElementById(d.dataset.target);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }));
  if (navSections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          dots.forEach(d => d.classList.toggle('is-active', d.dataset.target === e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    navSections.forEach(s => spy.observe(s));
  }

  /* ===== Scrollytelling process ===== */
  const steps = [...document.querySelectorAll('.scrolly__step')];
  const stageImg = document.querySelector('.scrolly__img');
  const stageChip = document.querySelector('.scrolly__chip');
  if (steps.length && stageImg) {
    const setActive = (step) => {
      steps.forEach(s => s.classList.toggle('is-active', s === step));
      const img = step.dataset.img;
      if (img && !stageImg.src.endsWith(img)) {
        stageImg.classList.add('swap');
        setTimeout(() => { stageImg.setAttribute('src', img); stageImg.classList.remove('swap'); }, 200);
      }
      if (stageChip) stageChip.innerHTML = '<b>' + (step.dataset.num || '') + '</b> ' + (step.dataset.label || '');
    };
    const so = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target); });
    }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });
    steps.forEach(s => so.observe(s));
    setActive(steps[0]);
  }

  /* ===== Before / After comparison slider ===== */
  document.querySelectorAll('.ba').forEach(ba => {
    const handle = ba.querySelector('.ba__handle');
    let dragging = false;
    const setPos = (clientX) => {
      const r = ba.getBoundingClientRect();
      let p = (clientX - r.left) / r.width;
      p = Math.max(0, Math.min(1, p));
      ba.style.setProperty('--pos', (p * 100) + '%');
    };
    const start = (e) => { dragging = true; ba.classList.add('dragging'); setPos(e.touches ? e.touches[0].clientX : e.clientX); };
    const move = (e) => { if (!dragging) return; setPos(e.touches ? e.touches[0].clientX : e.clientX); };
    const end = () => { dragging = false; ba.classList.remove('dragging'); };
    ba.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    ba.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', end);
    if (handle) {
      handle.setAttribute('tabindex', '0');
      handle.setAttribute('role', 'slider');
      handle.setAttribute('aria-label', 'Compare before and after');
      handle.addEventListener('keydown', (e) => {
        const cur = parseFloat(ba.style.getPropertyValue('--pos')) || 50;
        if (e.key === 'ArrowLeft') ba.style.setProperty('--pos', Math.max(0, cur - 4) + '%');
        if (e.key === 'ArrowRight') ba.style.setProperty('--pos', Math.min(100, cur + 4) + '%');
      });
    }
  });

  /* ===== Interactive results chart ===== */
  const chart = document.querySelector('.chart');
  if (chart) {
    const data = [2,5,9,14,22,31,40,55,72,90,120,160,210,260,320,400,520,680,860,1050,1280,1500,1720,1900,2060,2180,2270,2330,2380,2400];
    const W = 900, H = 340, pad = { l: 52, r: 20, t: 24, b: 36 }, max = 2500, n = data.length;
    const xs = (i) => pad.l + (i / (n - 1)) * (W - pad.l - pad.r);
    const ys = (v) => H - pad.b - (v / max) * (H - pad.t - pad.b);
    const fmt = (v) => v >= 1000 ? (v / 1000).toFixed(v % 1000 === 0 ? 0 : 2).replace(/\.00$/, '') + 'M' : v + 'K';
    let d = 'M' + xs(0) + ' ' + ys(data[0]);
    data.forEach((v, i) => { if (i) d += ' L' + xs(i).toFixed(1) + ' ' + ys(v).toFixed(1); });
    const area = d + ` L${xs(n - 1).toFixed(1)} ${H - pad.b} L${xs(0)} ${H - pad.b} Z`;
    const grid = [0, 625, 1250, 1875, 2500].map(v =>
      `<line x1="${pad.l}" y1="${ys(v)}" x2="${W - pad.r}" y2="${ys(v)}" stroke="#e3e3e6"/>` +
      `<text x="${pad.l - 10}" y="${ys(v) + 4}" text-anchor="end" font-size="11" fill="#86868b">${v >= 1000 ? v / 1000 + 'M' : v + 'K'}</text>`).join('');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#f0883e" stop-opacity="0.26"/>
          <stop offset="1" stop-color="#f0883e" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#e7b15a"/><stop offset="1" stop-color="#ff5d4d"/>
        </linearGradient>
      </defs>
      ${grid}
      <path class="chart__area" d="${area}" fill="url(#cg)" opacity="0"/>
      <path class="chart__line" d="${d}" fill="none" stroke="url(#cl)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="chart__guide" style="opacity:0">
        <line stroke="#c4631c" stroke-width="1" stroke-dasharray="3 4" y1="${pad.t}" y2="${H - pad.b}"/>
        <circle r="5.5" fill="#fff" stroke="#c4631c" stroke-width="2.5"/>
      </g>
      <text x="${pad.l}" y="${H - 8}" font-size="11" fill="#86868b">Day 1</text>
      <text x="${W - pad.r}" y="${H - 8}" text-anchor="end" font-size="11" fill="#86868b">Day 30</text>`;
    chart.insertBefore(svg, chart.firstChild);

    const line = svg.querySelector('.chart__line');
    const areaEl = svg.querySelector('.chart__area');
    const guide = svg.querySelector('.chart__guide');
    const gLine = guide.querySelector('line');
    const gDot = guide.querySelector('circle');
    const tip = chart.querySelector('.chart__tip');

    const len = line.getTotalLength();
    line.style.strokeDasharray = len;
    line.style.strokeDashoffset = reduce ? 0 : len;
    if (!reduce) {
      const io = new IntersectionObserver((es) => {
        es.forEach(e => {
          if (e.isIntersecting) {
            line.style.transition = 'stroke-dashoffset 1.7s ' + 'cubic-bezier(0.28,0.11,0.32,1)';
            line.style.strokeDashoffset = 0;
            areaEl.style.transition = 'opacity 1s ease .5s';
            areaEl.style.opacity = 1;
            io.disconnect();
          }
        });
      }, { threshold: 0.4 });
      io.observe(chart);
    } else { areaEl.style.opacity = 1; }

    const onMove = (e) => {
      const r = svg.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const xv = cx / r.width * W;
      let i = Math.round(((xv - pad.l) / (W - pad.l - pad.r)) * (n - 1));
      i = Math.max(0, Math.min(n - 1, i));
      const px = xs(i), py = ys(data[i]);
      guide.style.opacity = 1;
      gLine.setAttribute('x1', px); gLine.setAttribute('x2', px);
      gDot.setAttribute('cx', px); gDot.setAttribute('cy', py);
      if (tip) {
        tip.style.opacity = 1;
        tip.style.left = (px / W * 100) + '%';
        tip.innerHTML = `<strong>${fmt(data[i])}</strong><span>Day ${i + 1} · cumulative reach</span>`;
      }
    };
    const onLeave = () => { guide.style.opacity = 0; if (tip) tip.style.opacity = 0; };
    svg.addEventListener('mousemove', onMove);
    svg.addEventListener('mouseleave', onLeave);
    svg.addEventListener('touchmove', onMove, { passive: true });
    svg.addEventListener('touchend', onLeave);
  }

  /* ===== Lightbox gallery ===== */
  const lb = document.querySelector('.lightbox');
  if (lb) {
    const lbImg = lb.querySelector('.lightbox__img');
    const lbCap = lb.querySelector('.lightbox__cap');
    const items = [...document.querySelectorAll('[data-lightbox]')];
    let idx = 0;
    const open = (i) => {
      idx = i; const el = items[i];
      lbImg.src = el.dataset.lightbox;
      lbCap.textContent = el.dataset.caption || '';
      lb.classList.add('open');
      document.body.classList.add('no-scroll');
    };
    const close = () => { lb.classList.remove('open'); document.body.classList.remove('no-scroll'); };
    const nav = (dir) => open((idx + dir + items.length) % items.length);
    items.forEach((el, i) => el.addEventListener('click', () => open(i)));
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__prev').addEventListener('click', () => nav(-1));
    lb.querySelector('.lightbox__next').addEventListener('click', () => nav(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') nav(-1);
      if (e.key === 'ArrowRight') nav(1);
    });
  }
})();
