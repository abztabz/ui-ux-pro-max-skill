/* Caregiver dashboard logic. */
(function () {
  const S = SyaharShell;
  const session = S.mount({
    role: 'caregiver',
    title: 'Caregiver',
    roleLabel: 'Caregiver · Vetted',
    nav: [
      { href: '#visits',   icon: 'home',  label: 'Visits', active: true },
      { href: '#report',   icon: 'clip',  label: 'Report' },
      { href: '#families', icon: 'users', label: 'Families' },
      { href: '#chat',     icon: 'chat',  label: 'Chat' }
    ]
  });
  if (!session) return;

  const db = SyaharStore.db;

  document.getElementById('cgGreeting').textContent = 'Namaste, ' + session.name.split(' ')[0];

  /* ---- Visits ---- */
  document.getElementById('visitList').innerHTML = db.visits.map(function (v) {
    return '<div><div class="grow"><b>' + S.fmtDay(v.date) + ' · ' + v.time + '</b>' +
      '<span>' + v.patient + ' · ' + v.address + '<br>' + v.tasks.join(' · ') + '</span></div>' +
      (v.status === 'today'
        ? '<span class="badge badge-amber">Today</span>'
        : '<span class="badge badge-teal">Upcoming</span>') +
      '</div>';
  }).join('');

  /* ---- File report ---- */
  const form = document.getElementById('reportForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const fields = ['rMeals', 'rMeds', 'rMobility', 'rMood'].map(function (id) { return document.getElementById(id); });
    let ok = true;
    fields.forEach(function (f) {
      const valid = f.value.trim().length > 1;
      f.closest('.field').classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) return;

    const btn = document.getElementById('reportSubmit');
    btn.disabled = true; btn.textContent = 'Sending…';
    setTimeout(function () {
      SyaharStore.addReport({
        visit: 'Morning visit · 9:00–13:00',
        meals: fields[0].value.trim(),
        meds: fields[1].value.trim(),
        mobility: fields[2].value.trim(),
        mood: fields[3].value.trim(),
        notes: document.getElementById('rNotes').value.trim() || 'No additional notes.',
        photoConsent: document.getElementById('rConsent').checked
      });
      btn.disabled = false; btn.textContent = 'Submit report';
      document.getElementById('reportDone').style.display = 'inline-flex';
      form.reset();
      setTimeout(function () { document.getElementById('reportDone').style.display = 'none'; }, 5000);
    }, 700);
  });
  form.querySelectorAll('input').forEach(function (f) {
    f.addEventListener('input', function () {
      const wrap = f.closest('.field');
      if (wrap) wrap.classList.remove('invalid');
    });
  });

  /* ---- Families ---- */
  const p = db.patient;
  document.getElementById('familyList').innerHTML =
    '<div><span class="avatar">MD</span><div class="grow"><b>' + p.name + ', ' + p.age + '</b>' +
    '<span>' + p.city + ' · ' + p.conditions.join(', ') + '</span></div>' +
    '<span class="badge badge-success">Active</span></div>' +
    '<div><div class="grow"><b style="font-weight:600">Care plan</b><span>' + p.plan + ' · 5 visits/week · backup: Rama K.</span></div></div>' +
    '<div><div class="grow"><b style="font-weight:600">Family contact</b><span>Kiran Dhakal (son, UK) · in-app chat preferred</span></div></div>';

  /* ---- Chat (same thread as the family sees) ---- */
  function renderChat() {
    const scroll = document.getElementById('chatScroll');
    scroll.innerHTML = SyaharStore.db.messages.map(function (m) {
      const me = m.from === session.id;
      return '<div class="msg' + (me ? ' me' : '') + '"><div class="bubble">' + S.esc(m.text) + '</div>' +
        '<time>' + m.at.slice(5).replace('-', '/') + '</time></div>';
    }).join('');
    scroll.scrollTop = scroll.scrollHeight;
  }
  renderChat();

  document.getElementById('chatForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const input = document.getElementById('chatText');
    const text = input.value.trim();
    if (!text) return;
    SyaharStore.addMessage(session.id, text);
    input.value = '';
    renderChat();
  });

  /* ---- Calls ---- */
  S.wireCallOverlay();
  document.getElementById('audioCallBtn').addEventListener('click', function () { S.startCall('audio', 'Kiran Dhakal', 'KD'); });
  document.getElementById('videoCallBtn').addEventListener('click', function () { S.startCall('video', 'Kiran Dhakal', 'KD'); });

  S.markActiveOnScroll();
})();
