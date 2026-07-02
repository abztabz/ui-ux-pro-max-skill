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

  /* ---- Leads (landing page capture + manual entry + file import) ---- */
  const badge = { 'New': 'badge-amber', 'Discovery call booked': 'badge-teal', 'Vetting scheduled': 'badge-teal' };
  function renderLeads() {
    const leads = SyaharStore.db.leads;
    document.getElementById('leadRows').innerHTML = leads.map(function (l) {
      return '<tr><td style="white-space:nowrap">' + l.at + '</td>' +
        '<td><b style="font-family:var(--font-heading)">' + S.esc(l.name) + '</b></td>' +
        '<td>' + S.esc(l.contact) + '</td>' +
        '<td>' + S.esc(l.city) + '</td>' +
        '<td>' + S.esc(l.emergencyContact || '—') + '</td>' +
        '<td>' + S.esc(l.intent) + '</td>' +
        '<td><span class="badge ' + (badge[l.status] || 'badge-teal') + '">' + S.esc(l.status) + '</span></td></tr>';
    }).join('');
    document.getElementById('kpiLeads').textContent = leads.filter(function (l) { return l.status === 'New'; }).length;
  }
  renderLeads();

  let noticeTimer = null;
  function showNotice(text) {
    const n = document.getElementById('leadNotice');
    n.textContent = text;
    n.hidden = false;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { n.hidden = true; }, 6000);
  }

  /* ---- Add-leads menu ---- */
  const addBtn = document.getElementById('addLeadBtn');
  const addMenu = document.getElementById('addLeadMenu');
  addBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    addMenu.hidden = !addMenu.hidden;
    addBtn.setAttribute('aria-expanded', String(!addMenu.hidden));
  });
  document.addEventListener('click', function () {
    addMenu.hidden = true;
    addBtn.setAttribute('aria-expanded', 'false');
  });
  addMenu.addEventListener('click', function (e) {
    const item = e.target.closest('[data-act]');
    if (!item) return;
    if (item.dataset.act === 'manual') S.openModal('manualModal');
    if (item.dataset.act === 'import') { resetImport(); S.openModal('importModal'); }
  });

  /* ---- Manual entry ---- */
  S.wireModal('manualModal');
  const manualForm = document.getElementById('manualForm');
  manualForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('mlName');
    const contact = document.getElementById('mlContact');
    let ok = true;
    [name, contact].forEach(function (input) {
      const valid = input.value.trim().length > 1;
      input.closest('.field').classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) return;
    SyaharStore.addLead({
      name: name.value.trim(),
      contact: contact.value.trim(),
      city: document.getElementById('mlCity').value.trim() || '—',
      intent: document.getElementById('mlIntent').value
    });
    manualForm.reset();
    S.closeModal('manualModal');
    renderLeads();
    showNotice('Lead added — remember the 24-hour acknowledgement (SOP 1).');
  });
  [document.getElementById('mlName'), document.getElementById('mlContact')].forEach(function (input) {
    input.addEventListener('input', function () { input.closest('.field').classList.remove('invalid'); });
  });

  /* ---- File import (CSV — Excel saves to CSV natively) ---- */
  S.wireModal('importModal');
  let importRows = [];

  function parseCSV(text) {
    const rows = []; let row = [], cell = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; }
        else cell += ch;
      } else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); cell = '';
        if (row.some(function (c) { return c.trim() !== ''; })) rows.push(row);
        row = [];
      } else cell += ch;
    }
    row.push(cell);
    if (row.some(function (c) { return c.trim() !== ''; })) rows.push(row);
    return rows;
  }

  /* Find Name / Contact / City columns by header text; fall back to
     positional (col 1, 2, 3) when the file has no recognisable header. */
  function mapColumns(header) {
    const idx = { name: -1, contact: -1, city: -1 };
    header.forEach(function (h, i) {
      const k = String(h).trim().toLowerCase();
      if (idx.name === -1 && /name/.test(k)) idx.name = i;
      else if (idx.contact === -1 && /contact|email|phone|mobile|whatsapp/.test(k)) idx.contact = i;
      else if (idx.city === -1 && /city|location|area/.test(k)) idx.city = i;
    });
    return (idx.name !== -1 && idx.contact !== -1) ? idx : null;
  }

  function rowValid(r) { return r.name.trim().length > 1 && r.contact.trim().length > 1; }

  function resetImport() {
    importRows = [];
    document.getElementById('importFile').value = '';
    document.getElementById('importDropLabel').textContent = 'Choose a CSV file';
    document.getElementById('importError').hidden = true;
    document.getElementById('importPreviewWrap').hidden = true;
    document.getElementById('importGo').disabled = true;
  }

  function importFail(msg) {
    const err = document.getElementById('importError');
    err.textContent = msg;
    err.hidden = false;
    document.getElementById('importPreviewWrap').hidden = true;
    document.getElementById('importGo').disabled = true;
  }

  function renderImportPreview() {
    document.getElementById('importRows').innerHTML = importRows.map(function (r, i) {
      const skip = !rowValid(r);
      return '<tr class="' + (skip ? 'skip' : '') + '" data-row="' + i + '">' +
        '<td><span class="rowdot" title="' + (skip ? 'Will be skipped' : 'Ready') + '"></span></td>' +
        '<td><input data-col="name" value="' + S.esc(r.name) + '" aria-label="Name row ' + (i + 1) + '"></td>' +
        '<td><input data-col="contact" value="' + S.esc(r.contact) + '" aria-label="Contact row ' + (i + 1) + '"></td>' +
        '<td><input data-col="city" value="' + S.esc(r.city) + '" aria-label="City row ' + (i + 1) + '"></td>' +
        '<td><button class="btn btn-ghost btn-sm" data-del="' + i + '" aria-label="Remove row ' + (i + 1) + '" style="min-height:30px;padding:4px 10px">✕</button></td></tr>';
    }).join('');
    syncImportSummary();
    document.getElementById('importPreviewWrap').hidden = importRows.length === 0;
  }

  function syncImportSummary() {
    const good = importRows.filter(rowValid).length;
    const bad = importRows.length - good;
    document.getElementById('importSummary').textContent =
      good + ' ready' + (bad ? ' · ' + bad + ' will be skipped' : '');
    const go = document.getElementById('importGo');
    go.disabled = good === 0;
    go.textContent = good ? 'Import ' + good + ' lead' + (good === 1 ? '' : 's') : 'Import leads';
    /* refresh row states without re-rendering (keeps focus in the input) */
    Array.prototype.forEach.call(document.getElementById('importRows').children, function (tr) {
      tr.classList.toggle('skip', !rowValid(importRows[+tr.dataset.row]));
    });
  }

  function readFile(file) {
    if (!file) return;
    if (/\.xlsx?$/i.test(file.name)) {
      importFail('That is an Excel workbook (.xlsx). In Excel use File → Save As → CSV, then upload the CSV.');
      return;
    }
    const reader = new FileReader();
    reader.onload = function () {
      const rows = parseCSV(String(reader.result));
      if (!rows.length) { importFail('The file is empty.'); return; }
      const cols = mapColumns(rows[0]);
      const data = cols ? rows.slice(1) : rows;
      const at = cols || { name: 0, contact: 1, city: 2 };
      importRows = data.map(function (r) {
        return {
          name: String(r[at.name] || '').trim(),
          contact: String(r[at.contact] || '').trim(),
          city: String(r[at.city] || '').trim()
        };
      });
      if (!importRows.length) { importFail('No data rows found below the header.'); return; }
      document.getElementById('importError').hidden = true;
      document.getElementById('importDropLabel').textContent = file.name + ' · ' + importRows.length + ' rows';
      renderImportPreview();
    };
    reader.readAsText(file);
  }

  document.getElementById('importFile').addEventListener('change', function (e) {
    readFile(e.target.files[0]);
  });
  const drop = document.getElementById('importDrop');
  ['dragover', 'dragleave', 'drop'].forEach(function (ev) {
    drop.addEventListener(ev, function (e) {
      e.preventDefault();
      drop.classList.toggle('dragover', ev === 'dragover');
      if (ev === 'drop') readFile(e.dataTransfer.files[0]);
    });
  });

  document.getElementById('importRows').addEventListener('input', function (e) {
    const input = e.target.closest('input[data-col]');
    if (!input) return;
    const i = +input.closest('tr').dataset.row;
    importRows[i][input.dataset.col] = input.value;
    syncImportSummary();
  });
  document.getElementById('importRows').addEventListener('click', function (e) {
    const del = e.target.closest('[data-del]');
    if (!del) return;
    importRows.splice(+del.dataset.del, 1);
    renderImportPreview();
  });

  document.getElementById('importGo').addEventListener('click', function () {
    const good = importRows.filter(rowValid);
    const skipped = importRows.length - good.length;
    /* oldest row first so the newest ends up on top of the inbox */
    good.slice().reverse().forEach(function (r) {
      SyaharStore.addLead({
        name: r.name.trim(),
        contact: r.contact.trim(),
        city: r.city.trim() || '—',
        intent: 'I need care for my family'
      });
    });
    S.closeModal('importModal');
    renderLeads();
    showNotice('Imported ' + good.length + ' lead' + (good.length === 1 ? '' : 's') +
      (skipped ? ' · ' + skipped + ' row' + (skipped === 1 ? '' : 's') + ' skipped' : '') +
      ' — all start in Enquiry on the CRM board.');
  });

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
          (a.contact ? '<p style="margin-top:4px"><b style="font-weight:600">Local contact alerted:</b> ' + S.esc(a.contact) + '</p>' : '') +
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
