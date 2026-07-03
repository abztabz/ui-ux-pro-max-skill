/* Coordinator (admin) console logic. */
(function () {
  const S = SyaharShell;
  const session = S.mount({
    role: 'admin',
    title: 'Coordinator',
    roleLabel: 'Care coordinator',
    nav: [
      { href: '#overview',   icon: 'home',  label: 'Overview', active: true },
      { href: '#leads',      icon: 'inbox', label: 'Leads' },
      { href: '#alerts',     icon: 'bell',  label: 'Alerts' },
      { href: 'crm.html',    icon: 'users', label: 'CRM' },
      { href: 'cms.html',    icon: 'log',   label: 'CMS' }
    ]
  });
  if (!session) return;

  const db = SyaharStore.db;

  /* ---- KPIs ---- */
  document.getElementById('kpiLeads').textContent = db.leads.filter(function (l) { return l.status === 'New'; }).length;
  document.getElementById('kpiReports').textContent = db.reports.length;
  const unresolved = db.alerts.filter(function (a) { return !a.resolved; }).length;
  document.getElementById('kpiAlerts').textContent = unresolved;

  /* ---- Leads (includes anything captured on the landing page) ---- */
  const badge = { 'New': 'badge-amber', 'Discovery call booked': 'badge-teal', 'Vetting scheduled': 'badge-teal' };
  document.getElementById('leadRows').innerHTML = db.leads.map(function (l) {
    return '<tr><td style="white-space:nowrap">' + l.at + '</td>' +
      '<td><b style="font-family:var(--font-heading)">' + S.esc(l.name) + '</b></td>' +
      '<td>' + S.esc(l.contact) + '</td>' +
      '<td>' + S.esc(l.city) + '</td>' +
      '<td>' + S.esc(l.intent) + '</td>' +
      '<td><span class="badge ' + (badge[l.status] || 'badge-teal') + '">' + S.esc(l.status) + '</span></td></tr>';
  }).join('');

  /* ---- Add-on orders ---- */
  function renderOrders() {
    const orders = SyaharStore.db.orders || [];
    document.getElementById('ordersPanel').innerHTML = orders.length
      ? '<div class="row-list">' + orders.map(function (o) {
          return '<div><div class="grow"><b>' + S.esc(o.item) + ' · ' + S.esc(o.price) + '</b>' +
            '<span>' + S.esc(o.family) + ' · ' + o.at + '</span></div>' +
            '<span class="badge ' + (o.status === 'Completed' ? 'badge-success' : 'badge-amber') + '">' + S.esc(o.status) + '</span></div>';
        }).join('') + '</div>'
      : '<div class="empty-state">' + S.icon('card', 36) + '<b>No add-on orders</b>Requests from family dashboards appear here.</div>';
  }
  renderOrders();

  /* ---- Roster + vetting workflow (SOP 2) ---- */
  const CHECKS = [
    { key: 'id',         label: 'Government photo ID on file' },
    { key: 'police',     label: 'Police / background check, dated within 12 months' },
    { key: 'references', label: 'Two references — actually called' },
    { key: 'health',     label: 'Basic health check' },
    { key: 'insurance',  label: 'Insurance cover confirmed' },
    { key: 'screen',     label: 'Video screen passed — you would trust them with your own parent' },
    { key: 'backup',     label: 'Named backup caregiver exists' }
  ];
  let openVetId = null;

  function roster() { return SyaharStore.db.caregiverRoster; }

  function renderRoster() {
    document.getElementById('rosterRows').innerHTML = roster().map(function (c) {
      const ok = c.vetting === 'Complete';
      return '<tr data-vet="' + (c.id || '') + '" style="cursor:pointer">' +
        '<td><b style="font-family:var(--font-heading)">' + S.esc(c.name) + '</b></td>' +
        '<td>' + S.esc(c.area) + '</td>' +
        '<td><span class="badge ' + (ok ? 'badge-success' : 'badge-amber') + '">' + S.esc(c.vetting) + '</span></td>' +
        '<td>' + S.esc(c.backup) + '</td><td>' + c.families + '</td></tr>';
    }).join('');
  }
  renderRoster();

  const vetDrawer = document.getElementById('vetDrawer');
  const vetBackdrop = document.getElementById('drawerBackdrop');

  function openVet(id) {
    const c = roster().find(function (x) { return x.id === id; });
    if (!c) return;
    openVetId = id;
    document.getElementById('vetAvatar').textContent = c.name.split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('vetName').textContent = c.name;
    document.getElementById('vetMeta').textContent = c.area + ' · ' + c.vetting + ' · backup: ' + c.backup;
    renderChecklist(c);
    vetDrawer.classList.add('open');
    vetBackdrop.classList.add('open');
  }
  function renderChecklist(c) {
    const cl = c.checklist || {};
    document.getElementById('vetChecklist').innerHTML = CHECKS.map(function (chk) {
      return '<div><label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;flex:1">' +
        '<input type="checkbox" data-check="' + chk.key + '" ' + (cl[chk.key] ? 'checked' : '') +
        ' style="width:20px;height:20px;accent-color:var(--teal-600);margin-top:1px"' + (c.vetting === 'Complete' ? ' disabled' : '') + '>' +
        '<span style="font-size:var(--fs-small);color:var(--color-text-2)">' + chk.label + '</span></label></div>';
    }).join('');
    syncVetButton(c);
  }
  function syncVetButton(c) {
    const cl = c.checklist || {};
    const done = CHECKS.every(function (chk) { return cl[chk.key]; });
    const btn = document.getElementById('vetComplete');
    const hint = document.getElementById('vetHint');
    if (c.vetting === 'Complete') {
      btn.disabled = true; btn.textContent = 'Vetting complete ✓';
      hint.textContent = 'On the roster and available for matching.';
    } else {
      btn.disabled = !done;
      btn.textContent = 'Mark vetting complete';
      const missing = CHECKS.filter(function (chk) { return !cl[chk.key]; }).length;
      hint.textContent = done ? 'All hard stops cleared.' : missing + ' of ' + CHECKS.length + ' hard stops outstanding.';
    }
  }
  document.getElementById('vetChecklist').addEventListener('change', function (e) {
    const box = e.target.closest('[data-check]');
    if (!box || !openVetId) return;
    const c = roster().find(function (x) { return x.id === openVetId; });
    const cl = Object.assign({}, c.checklist);
    cl[box.dataset.check] = box.checked;
    SyaharStore.updateRosterEntry(openVetId, { checklist: cl, vetting: 'In progress' });
    const updated = roster().find(function (x) { return x.id === openVetId; });
    document.getElementById('vetMeta').textContent = updated.area + ' · ' + updated.vetting + ' · backup: ' + updated.backup;
    syncVetButton(updated);
    renderRoster();
  });
  document.getElementById('vetComplete').addEventListener('click', function () {
    if (!openVetId) return;
    SyaharStore.updateRosterEntry(openVetId, { vetting: 'Complete' });
    renderChecklist(roster().find(function (x) { return x.id === openVetId; }));
    renderRoster();
  });
  function closeVet() {
    vetDrawer.classList.remove('open');
    vetBackdrop.classList.remove('open');
    openVetId = null;
  }
  document.getElementById('vetClose').addEventListener('click', closeVet);
  vetBackdrop.addEventListener('click', closeVet);
  document.getElementById('rosterRows').addEventListener('click', function (e) {
    const row = e.target.closest('[data-vet]');
    if (row && row.dataset.vet) openVet(row.dataset.vet);
  });

  /* ---- Alerts ---- */
  const levelMeta = {
    3: { cls: 'l3', label: 'Level 3 · Medical emergency' },
    2: { cls: 'l2', label: 'Level 2 · Urgent' },
    1: { cls: 'l1', label: 'Level 1 · Operational' }
  };
  const feed = document.getElementById('alertFeed');
  feed.innerHTML = db.alerts.length
    ? db.alerts.map(function (a) {
        const m = levelMeta[a.level];
        return '<div class="sev ' + m.cls + '"><span class="dot"></span><div style="flex:1">' +
          '<b>' + m.label + ' · ' + S.esc(a.family) + '</b>' +
          '<p>' + S.esc(a.text) + '</p>' +
          '<p class="tiny muted" style="margin-top:4px">' + a.at + (a.resolved ? ' · resolved' : ' · OPEN — act now') + '</p>' +
          '</div>' +
          (a.resolved
            ? '<span class="badge badge-success" style="align-self:flex-start">Resolved</span>'
            : '<span class="badge badge-rose" style="align-self:flex-start">Open</span>') +
          '</div>';
      }).join('')
    : '<div class="empty-state">' + S.icon('bell', 40) + '<b>No alerts</b>Emergencies and operational issues appear here.</div>';

  S.markActiveOnScroll();
})();
