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
      { href: '#placements', icon: 'heart', label: 'Placements' },
      { href: '#roster',     icon: 'users', label: 'Roster' },
      { href: '#alerts',     icon: 'bell',  label: 'Alerts' }
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

  /* ---- Roster ---- */
  document.getElementById('rosterRows').innerHTML = db.caregiverRoster.map(function (c) {
    const ok = c.vetting === 'Complete';
    return '<tr><td><b style="font-family:var(--font-heading)">' + c.name + '</b></td>' +
      '<td>' + c.area + '</td>' +
      '<td><span class="badge ' + (ok ? 'badge-success' : 'badge-amber') + '">' + c.vetting + '</span></td>' +
      '<td>' + c.backup + '</td><td>' + c.families + '</td></tr>';
  }).join('');

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
