/* Family dashboard logic. */
(function () {
  const S = SyaharShell;
  const session = S.mount({
    role: 'family',
    title: 'Family',
    roleLabel: 'Family member',
    nav: [
      { href: '#home',    icon: 'home',  label: 'Home', active: true },
      { href: '#health',  icon: 'clip',  label: 'Health' },
      { href: '#log',     icon: 'log',   label: 'Daily log' },
      { href: '#chat',    icon: 'chat',  label: 'Chat' },
      { href: '#billing', icon: 'card',  label: 'Billing' }
    ]
  });
  if (!session) return;

  const db = SyaharStore.db;
  const p = db.patient;

  /* ---- Home ---- */
  document.getElementById('greeting').textContent = 'Namaste, ' + session.name.split(' ')[0];
  document.getElementById('planLine').textContent = p.name + ' · ' + p.plan;
  document.getElementById('patientName').textContent = p.name + ', ' + p.age;
  document.getElementById('patientMeta').textContent = p.city + ' · Blood group ' + p.bloodGroup;

  const latest = db.reports[0];
  document.getElementById('latestProof').innerHTML = latest
    ? '<div class="sev l1" style="border-color:var(--teal-100);background:var(--teal-050)">' +
      '<span class="dot"></span><div><b>Latest proof · ' + S.fmtDay(latest.date) + '</b>' +
      '<p>' + S.esc(latest.notes) + '</p></div></div>'
    : '';

  document.getElementById('weekList').innerHTML =
    db.visits.map(function (v) {
      return '<div><div class="grow"><b>' + S.fmtDay(v.date) + ' · ' + v.time + '</b>' +
        '<span>' + v.tasks.join(' · ') + '</span></div>' +
        (v.status === 'today' ? '<span class="badge badge-amber">Today</span>' : '<span class="badge badge-teal">Planned</span>') +
        '</div>';
    }).join('') +
    '<div><div class="grow"><b>Saturday · Weekly video call</b><span>You + Aama + Sita didi</span></div>' +
    '<button class="btn btn-ghost btn-sm" id="weeklyCallBtn">Join</button></div>';

  /* ---- Health ---- */
  const v = p.vitalsHistory[p.vitalsHistory.length - 1];
  const prev = p.vitalsHistory[p.vitalsHistory.length - 2];
  document.getElementById('vitalsGrid').innerHTML =
    '<div class="vital"><span>Blood pressure</span><b>' + v.bp + '</b><small>was ' + prev.bp + '</small></div>' +
    '<div class="vital"><span>Pulse</span><b>' + v.pulse + '</b><small>bpm · resting</small></div>' +
    '<div class="vital"><span>Weight</span><b>' + v.weight + ' kg</b><small>stable</small></div>' +
    '<div class="vital"><span>Mood</span><b>' + v.mood + '</b><small>' + S.fmtDay(v.date) + '</small></div>';

  document.getElementById('medsList').innerHTML = p.medications.map(function (m) {
    return '<div><div class="grow"><b>' + m.name + '</b><span>' + m.schedule + ' · ' + m.purpose + '</span></div>' +
      '<span class="badge badge-success">On track</span></div>';
  }).join('');

  document.getElementById('profileList').innerHTML =
    '<div><div class="grow"><b>Conditions</b><span>' + p.conditions.join(', ') + '</span></div></div>' +
    '<div><div class="grow"><b>Allergies</b><span>' + p.allergies.join(', ') + '</span></div></div>' +
    '<div><div class="grow"><b>Doctor</b><span>' + p.doctor + '</span></div></div>' +
    '<div><div class="grow"><b>Local emergency contact</b><span>' + p.emergencyContact + '</span></div></div>';

  document.getElementById('docsList').innerHTML = p.documents.map(function (d) {
    return '<div><div class="grow"><b>' + d.name + '</b><span>' + d.kind + ' · ' + d.date + '</span></div>' +
      '<button class="btn btn-ghost btn-sm">View</button></div>';
  }).join('');

  /* ---- Daily log ---- */
  function renderReports() {
    const reports = SyaharStore.db.reports;
    document.getElementById('reportsPanel').innerHTML = reports.length
      ? reports.map(function (r) {
          return '<div class="report-item">' +
            '<div class="when"><b>' + S.fmtDay(r.date) + '</b><span>' + S.esc(r.visit || 'Visit') + '</span></div>' +
            '<div><h4>Report from Sita</h4>' +
            '<div class="facts">' +
            '<span>Meals: ' + S.esc(shorten(r.meals)) + '</span>' +
            '<span>Meds: ' + S.esc(shorten(r.meds)) + '</span>' +
            '<span>Mobility: ' + S.esc(shorten(r.mobility)) + '</span>' +
            '<span>Mood: ' + S.esc(shorten(r.mood)) + '</span>' +
            '</div><p>' + S.esc(r.notes) + (r.photoConsent ? ' <span class="badge badge-teal" style="margin-left:4px">Photos shared with consent</span>' : '') + '</p>' +
            '</div></div>';
        }).join('')
      : '<div class="empty-state">' + S.icon('log', 40) + '<b>No reports yet</b>They appear here after each visit.</div>';
  }
  function shorten(t) { return t.length > 34 ? t.slice(0, 32) + '…' : t; }
  renderReports();

  /* ---- Chat ---- */
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
  document.getElementById('audioCallBtn').addEventListener('click', function () { S.startCall('audio', 'Sita Gurung', 'SG'); });
  document.getElementById('videoCallBtn').addEventListener('click', function () { S.startCall('video', 'Sita Gurung', 'SG'); });
  const weekly = document.getElementById('weeklyCallBtn');
  if (weekly) weekly.addEventListener('click', function () { S.startCall('video', 'Aama + Sita didi', 'MD'); });

  /* ---- Emergency ---- */
  S.wireModal('emergencyModal');
  ['emergencyBtn', 'emergencyFab'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function () { S.openModal('emergencyModal'); });
  });
  document.querySelectorAll('#emergencyModal [data-alert]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const level = Number(btn.dataset.alert);
      SyaharStore.addAlert(level, 'Dhakal family', 'Family raised a level-' + level + ' alert from the dashboard.');
      document.getElementById('emStatus').innerHTML =
        '<strong style="color:var(--teal-700)">Coordinator alerted (' +
        new Date().toTimeString().slice(0, 5) + ').</strong> You will be called back within minutes. In a medical emergency, always call 102 first.';
      btn.disabled = true; btn.textContent = 'Coordinator alerted ✓';
    });
  });

  /* ---- Billing ---- */
  const b = db.billing;
  document.getElementById('billPlan').innerHTML =
    '<div><div class="grow"><b>' + b.plan + ' plan</b><span>' + b.amount + ' · next due ' + S.fmtDay(b.nextDue) + '</span></div><span class="badge badge-success">Paid</span></div>' +
    b.breakdown.map(function (x) {
      return '<div><div class="grow"><b style="font-weight:600">' + x.label + '</b></div><span style="font-family:var(--font-heading);font-weight:700;color:var(--teal-700)">' + x.value + '</span></div>';
    }).join('');
  document.getElementById('billSplit').innerHTML = b.split.map(function (x) {
    return '<div><div class="grow"><b>' + x.name + '</b><span>' + x.share + '</span></div><span class="badge badge-success">' + x.status + '</span></div>';
  }).join('') +
  '<div><div class="grow"><b style="font-weight:600">Invite another sibling</b><span>Each person pays their share in their own currency.</span></div><button class="btn btn-ghost btn-sm">Invite</button></div>';

  S.markActiveOnScroll();
})();
