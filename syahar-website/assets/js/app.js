/* ============================================================
   Syahar app shell — shared by family / caregiver / admin pages.
   Renders the sidebar (desktop) + tab bar (mobile) from a nav
   config, and owns the emergency modal and the call overlay.
   In the mobile app these become the navigation container,
   the emergency flow, and the WebRTC call screen.
   ============================================================ */
window.SyaharShell = (function () {

  const ICONS = {
    home:   '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z"/><path d="M9 22V12h6v10"/>',
    heart:  '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
    log:    '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 10h8M8 14h5"/>',
    chat:   '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    card:   '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',
    users:  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    clip:   '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>',
    inbox:  '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    bell:   '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>'
  };

  function icon(name, size) {
    return '<svg width="' + (size || 19) + '" height="' + (size || 19) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function navLinks(items, cls) {
    return items.map(function (it) {
      return '<a href="' + it.href + '"' + (it.active ? ' class="active" aria-current="page"' : '') + '>' +
        icon(it.icon, cls === 'tabbar' ? 21 : 19) + '<span>' + it.label + '</span></a>';
    }).join('');
  }

  /* Render sidebar + mobile chrome into the placeholders. */
  function mount(config) {
    const s = SyaharStore.guard(config.role);
    if (!s) return null;

    document.getElementById('shellSidebar').innerHTML =
      '<div class="brand"><span class="mark">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0a04b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.heart + '</svg>' +
      '</span><div><b>Syahar</b><small>' + config.title + '</small></div></div>' +
      '<nav class="side-nav" aria-label="Sections">' + navLinks(config.nav) + '</nav>' +
      '<div class="session"><span class="avatar">' + s.avatar + '</span>' +
      '<div><b>' + s.name + '</b><span>' + config.roleLabel + '</span></div>' +
      '<button id="logoutBtn" title="Log out" aria-label="Log out">' + icon('logout') + '</button></div>';

    document.getElementById('shellMobileTop').innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0a04b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS.heart + '</svg>' +
      '<b>' + config.title + '</b><span class="avatar">' + s.avatar + '</span>';

    document.getElementById('shellTabbar').innerHTML = navLinks(config.nav, 'tabbar');

    document.getElementById('logoutBtn').addEventListener('click', function () {
      SyaharStore.logout();
      window.location.href = '../login.html';
    });
    return s;
  }

  /* Smooth-scroll section nav for single-page dashboards. */
  function markActiveOnScroll() {
    const links = Array.prototype.slice.call(document.querySelectorAll('.side-nav a, .tabbar a'));
    if (!('IntersectionObserver' in window)) return;
    const map = {};
    links.forEach(function (a) {
      const id = (a.getAttribute('href') || '').replace('#', '');
      if (id) (map[id] = map[id] || []).push(a);
    });
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('active'); });
          map[en.target.id].forEach(function (a) { a.classList.add('active'); });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  /* ---- Modal helpers ---- */
  function openModal(id) { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }
  function wireModal(id) {
    const el = document.getElementById(id);
    el.addEventListener('click', function (e) { if (e.target === el) closeModal(id); });
    el.querySelectorAll('[data-close]').forEach(function (b) {
      b.addEventListener('click', function () { closeModal(id); });
    });
  }

  /* ---- Call overlay (simulated WebRTC for the wireframe) ---- */
  let callTimer = null;
  function startCall(kind, name, avatar) {
    const ov = document.getElementById('callOverlay');
    ov.classList.add('open');
    ov.classList.toggle('video', kind === 'video');
    document.getElementById('callName').textContent = name;
    document.getElementById('callAvatar').textContent = avatar;
    const state = document.getElementById('callState');
    state.textContent = (kind === 'video' ? 'Video calling' : 'Calling') + '…';
    let secs = 0;
    clearInterval(callTimer);
    callTimer = setInterval(function () {
      secs++;
      if (secs === 2) state.textContent = 'Connected · demo call';
      if (secs > 2) {
        const m = String(Math.floor((secs - 2) / 60)).padStart(2, '0');
        const sec = String((secs - 2) % 60).padStart(2, '0');
        state.textContent = m + ':' + sec + ' · demo call';
      }
    }, 1000);
  }
  function endCall() {
    clearInterval(callTimer);
    document.getElementById('callOverlay').classList.remove('open');
    const mute = document.getElementById('callMute');
    if (mute) mute.classList.remove('muted');
  }
  function wireCallOverlay() {
    document.getElementById('callEnd').addEventListener('click', endCall);
    const mute = document.getElementById('callMute');
    mute.addEventListener('click', function () { mute.classList.toggle('muted'); });
  }

  function fmtDay(iso) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  return {
    mount: mount, icon: icon, markActiveOnScroll: markActiveOnScroll,
    openModal: openModal, closeModal: closeModal, wireModal: wireModal,
    startCall: startCall, endCall: endCall, wireCallOverlay: wireCallOverlay,
    fmtDay: fmtDay, esc: esc
  };
})();
