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

  /* ---- Emergency ----
     Every alert reaches the coordinator AND the local emergency
     contact from the care file — someone physically near Aama. */
  S.wireModal('emergencyModal');
  ['emergencyBtn', 'emergencyFab'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function () { S.openModal('emergencyModal'); });
  });
  const emContact = p.emergencyContact;
  const emContactName = emContact.split('·')[0].trim();
  document.getElementById('emContact').innerHTML =
    '<b>Also alerted, every time:</b> ' + S.esc(emContact) + ' — the local emergency contact from Aama’s care file.';
  document.querySelectorAll('#emergencyModal [data-alert]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const level = Number(btn.dataset.alert);
      SyaharStore.addAlert(level, 'Dhakal family', 'Family raised a level-' + level + ' alert from the dashboard.', emContact);
      document.getElementById('emStatus').innerHTML =
        '<strong style="color:var(--teal-700)">Coordinator and ' + S.esc(emContactName) + ' alerted (' +
        new Date().toTimeString().slice(0, 5) + ').</strong> You will be called back within minutes. In a medical emergency, always call 102 first.';
      btn.disabled = true; btn.textContent = 'Coordinator alerted ✓';
    });
  });

  /* ---- Billing ----
     Share states: Due → Paid. Your own Due share gets a Pay button;
     a sibling's Due share just shows the state (they pay from their
     own login). Re-rendered after every payment. */
  function renderBilling() {
    const b = SyaharStore.db.billing;
    const anyDue = b.split.some(function (x) { return x.status !== 'Paid'; });
    document.getElementById('billPlan').innerHTML =
      '<div><div class="grow"><b>' + b.plan + ' plan</b><span>' + b.amount + ' · next due ' + S.fmtDay(b.nextDue) + '</span></div>' +
      (anyDue ? '<span class="badge badge-amber">Payment due</span>' : '<span class="badge badge-success">Paid</span>') + '</div>' +
      b.breakdown.map(function (x) {
        return '<div><div class="grow"><b style="font-weight:600">' + x.label + '</b></div><span style="font-family:var(--font-heading);font-weight:700;color:var(--teal-700)">' + x.value + '</span></div>';
      }).join('');
    document.getElementById('billSplit').innerHTML = b.split.map(function (x) {
      const paid = x.status === 'Paid';
      return '<div><div class="grow"><b>' + S.esc(x.name) + '</b><span>' + S.esc(x.share) +
        (paid && x.method ? ' · via ' + S.esc(x.method) : '') + '</span></div>' +
        (paid
          ? '<span class="badge badge-success">Paid</span>'
          : (x.userId === session.id
              ? '<button class="btn btn-primary btn-sm" data-pay="' + x.id + '">Pay now</button>'
              : '<span class="badge badge-amber">Due</span>')) +
        '</div>';
    }).join('') +
    '<div><div class="grow"><b style="font-weight:600">Invite another sibling</b><span>Each person pays their share in their own currency.</span></div><button class="btn btn-ghost btn-sm">Invite</button></div>';
  }
  renderBilling();

  /* ---- Payment flow (gateway decided later) ----
     The list below is display config — adding eSewa / FonePay for a
     Nepal-based payer, or Samsung Pay, is one more line here. */
  const PAY_METHODS = [
    { id: 'card',      label: 'Credit or debit card', hint: 'Visa · Mastercard · Amex' },
    { id: 'paypal',    label: 'PayPal',               hint: 'Balance or linked card' },
    { id: 'applepay',  label: 'Apple Pay',            hint: 'One tap on iPhone or Mac' },
    { id: 'googlepay', label: 'Google Pay',           hint: 'One tap on Android or Chrome' }
  ];
  let payShareId = null;
  let payMethod = null;

  S.wireModal('payModal');

  function openPay(shareId) {
    const b = SyaharStore.db.billing;
    const entry = b.split.find(function (x) { return x.id === shareId; });
    if (!entry || entry.status === 'Paid') return;
    payShareId = shareId;
    payMethod = null;
    document.getElementById('payBody').hidden = false;
    document.getElementById('paySuccess').hidden = true;
    document.getElementById('payClose').textContent = 'Cancel';
    document.getElementById('paySummary').textContent =
      'Your share of the ' + b.plan + ' plan — ' + entry.share + '. Due ' + S.fmtDay(b.nextDue) + '.';
    document.getElementById('payMethods').innerHTML = PAY_METHODS.map(function (m) {
      return '<div><label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;flex:1">' +
        '<input type="radio" name="payMethod" value="' + m.label + '" data-method="' + m.id + '"' +
        ' style="width:20px;height:20px;accent-color:var(--teal-600);margin-top:1px">' +
        '<span class="grow"><b>' + m.label + '</b><span>' + m.hint + '</span></span></label></div>';
    }).join('');
    const go = document.getElementById('payGo');
    go.disabled = true;
    go.textContent = 'Choose a payment method';
    S.openModal('payModal');
  }

  document.getElementById('billSplit').addEventListener('click', function (e) {
    const btn = e.target.closest('[data-pay]');
    if (btn) openPay(btn.dataset.pay);
  });

  document.getElementById('payMethods').addEventListener('change', function (e) {
    const radio = e.target.closest('input[name="payMethod"]');
    if (!radio) return;
    payMethod = radio.value;
    const entry = SyaharStore.db.billing.split.find(function (x) { return x.id === payShareId; });
    const go = document.getElementById('payGo');
    go.disabled = false;
    go.textContent = 'Pay ' + entry.share.split('·')[0].trim() + ' with ' + payMethod;
  });

  document.getElementById('payGo').addEventListener('click', function () {
    if (!payShareId || !payMethod) return;
    const go = document.getElementById('payGo');
    go.disabled = true;
    go.textContent = 'Processing…';
    /* Simulated gateway round-trip; the real gateway call replaces this. */
    setTimeout(function () {
      const ref = SyaharStore.recordPayment(payShareId, payMethod);
      document.getElementById('payBody').hidden = true;
      document.getElementById('paySuccess').hidden = false;
      document.getElementById('paySuccessText').textContent =
        'Your share is paid via ' + payMethod + '. A receipt is on its way to your email, and the coordinator can see it instantly.';
      document.getElementById('payRef').textContent = ref ? 'Payment reference: ' + ref : '';
      document.getElementById('payClose').textContent = 'Done';
      renderBilling();
    }, 1400);
  });

  /* ---- Add-ons (the à la carte layer) ---- */
  const ADDONS = [
    { item: 'Doctor home visit',      price: 'Rs 3,500', desc: 'A physician visits Aama at home; notes go into her health record.' },
    { item: 'Medicine delivery',      price: 'Rs 600',   desc: 'Monthly medications delivered and checked against the plan. Plus cost of meds.' },
    { item: 'Physiotherapy session',  price: 'Rs 2,000', desc: 'Licensed physiotherapist — recommended for her knees.' },
    { item: 'Festival visit & gift',  price: 'Rs 2,500', desc: 'A gift and companionship on Dashain or Tihar, photos included.' }
  ];
  function renderAddons() {
    const ordered = {};
    (SyaharStore.db.orders || []).forEach(function (o) {
      if (o.status === 'Requested') ordered[o.item] = true;
    });
    document.getElementById('addonsList').innerHTML = ADDONS.map(function (a, i) {
      return '<div><div class="grow"><b>' + a.item + ' · <span style="color:var(--teal-700)">' + a.price + '</span></b>' +
        '<span>' + a.desc + '</span></div>' +
        (ordered[a.item]
          ? '<span class="badge badge-success">Requested ✓</span>'
          : '<button class="btn btn-ghost btn-sm" data-addon="' + i + '">Request</button>') +
        '</div>';
    }).join('');
  }
  renderAddons();
  document.getElementById('addonsList').addEventListener('click', function (e) {
    const b = e.target.closest('[data-addon]');
    if (!b) return;
    const a = ADDONS[Number(b.dataset.addon)];
    b.disabled = true; b.textContent = 'Requesting…';
    setTimeout(function () {
      SyaharStore.addOrder(a.item, a.price);
      renderAddons();
    }, 500);
  });

  S.markActiveOnScroll();
})();
