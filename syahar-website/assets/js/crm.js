/* CRM board — SOP pipeline over the shared lead store. */
(function () {
  const S = SyaharShell;
  const session = S.mount({
    role: 'admin',
    title: 'CRM',
    roleLabel: 'Care coordinator',
    nav: [
      { href: 'admin.html', icon: 'home',  label: 'Console' },
      { href: 'crm.html',   icon: 'users', label: 'CRM', active: true },
      { href: 'cms.html',   icon: 'log',   label: 'CMS' },
      { href: '../index.html', icon: 'heart', label: 'View site' }
    ]
  });
  if (!session) return;

  const STAGES = [
    { id: 'enquiry', label: 'Enquiry',      hint: 'SOP 1 · acknowledge in 24h' },
    { id: 'qualify', label: 'Qualified',    hint: 'discovery call held' },
    { id: 'match',   label: 'Match & vet',  hint: 'SOP 2 · hard stops apply' },
    { id: 'intro',   label: 'Intro call',   hint: 'SOP 3 · the keystone' },
    { id: 'placed',  label: 'Placed',       hint: 'SOP 4-5 · weekly proof' }
  ];
  const STAGE_IDS = STAGES.map(function (s) { return s.id; });

  /* Older stored leads (pre-CRM) may lack stage/notes — normalize once. */
  function normalize(lead) {
    if (!lead.stage) {
      const map = { 'New': 'enquiry', 'Discovery call booked': 'qualify', 'Vetting scheduled': 'match', 'Intro call scheduled': 'intro' };
      SyaharStore.updateLead(lead.id, {
        stage: map[lead.status] || 'enquiry',
        notes: lead.notes || [],
        nextAction: lead.nextAction || 'Acknowledge within 24 hours (SOP 1)'
      });
    }
  }
  SyaharStore.db.leads.forEach(normalize);

  let openLeadId = null;

  function leads() { return SyaharStore.db.leads; }

  /* ---- KPIs ---- */
  function renderKpis() {
    const all = leads();
    const inPipe = all.filter(function (l) { return l.stage !== 'placed'; }).length;
    const placed = all.filter(function (l) { return l.stage === 'placed'; }).length;
    const caregivers = all.filter(function (l) { return (l.intent || '').indexOf('provide') !== -1; }).length;
    const conv = all.length ? Math.round((placed / all.length) * 100) : 0;
    document.getElementById('crmKpis').innerHTML =
      '<div class="card kpi"><b>' + inPipe + '</b><span>In pipeline</span></div>' +
      '<div class="card kpi"><b>' + placed + '</b><span>Placed</span></div>' +
      '<div class="card kpi"><b>' + caregivers + '</b><span>Caregiver applicants</span></div>' +
      '<div class="card kpi"><b>' + conv + '%</b><span>Enquiry → placement</span></div>';
  }

  /* ---- Follow-ups ---- */
  function renderFollowUps() {
    const withActions = leads().filter(function (l) { return l.nextAction && l.stage !== 'placed'; });
    document.getElementById('followUps').innerHTML = withActions.length
      ? withActions.map(function (l) {
          return '<div><div class="grow"><b>' + S.esc(l.name) + '</b><span>' + S.esc(l.nextAction) + '</span></div>' +
            '<button class="btn btn-ghost btn-sm" data-open="' + l.id + '">Open</button></div>';
        }).join('')
      : '<div class="empty-state">' + S.icon('clip', 36) + '<b>All clear</b>No pending follow-ups.</div>';
  }

  /* ---- Kanban ---- */
  function renderBoard() {
    const board = document.getElementById('kanban');
    board.innerHTML = STAGES.map(function (st) {
      const cards = leads().filter(function (l) { return l.stage === st.id; });
      return '<div class="kcol" data-stage="' + st.id + '">' +
        '<div class="kcol-head"><b>' + st.label + '</b><span class="count">' + cards.length + '</span></div>' +
        (cards.length ? cards.map(cardHtml).join('') :
          '<span class="tiny muted" style="padding:4px 6px">' + st.hint + '</span>') +
        '</div>';
    }).join('');

    /* open drawer */
    board.querySelectorAll('.kcard').forEach(function (el) {
      el.addEventListener('click', function (e) {
        if (e.target.closest('.kmove')) return;
        openDrawer(el.dataset.id);
      });
      /* drag (desktop) */
      el.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', el.dataset.id);
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', function () { el.classList.remove('dragging'); });
    });

    /* move buttons (mobile) */
    board.querySelectorAll('.kmove button').forEach(function (b) {
      b.addEventListener('click', function () { moveLead(b.dataset.id, Number(b.dataset.dir)); });
    });

    /* drop targets */
    board.querySelectorAll('.kcol').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('dragover'); });
      col.addEventListener('dragleave', function () { col.classList.remove('dragover'); });
      col.addEventListener('drop', function (e) {
        e.preventDefault(); col.classList.remove('dragover');
        setStage(e.dataTransfer.getData('text/plain'), col.dataset.stage);
      });
    });
  }

  function cardHtml(l) {
    const idx = STAGE_IDS.indexOf(l.stage);
    return '<div class="kcard" draggable="true" data-id="' + l.id + '">' +
      '<b>' + S.esc(l.name) + '</b>' +
      '<span class="kmeta">' + S.esc(l.city || '—') + ' · ' + S.esc(l.intent || '') + '</span>' +
      (l.nextAction ? '<span class="knext">→ ' + S.esc(l.nextAction) + '</span>' : '') +
      '<div class="kmove">' +
      (idx > 0 ? '<button data-id="' + l.id + '" data-dir="-1">◀ Back</button>' : '') +
      (idx < STAGE_IDS.length - 1 ? '<button data-id="' + l.id + '" data-dir="1">Advance ▶</button>' : '') +
      '</div></div>';
  }

  const STATUS_BY_STAGE = {
    enquiry: 'New', qualify: 'Discovery call booked', match: 'Vetting scheduled',
    intro: 'Intro call scheduled', placed: 'Placed'
  };
  function setStage(id, stage) {
    if (!STAGE_IDS.includes(stage)) return;
    SyaharStore.updateLead(id, { stage: stage, status: STATUS_BY_STAGE[stage] });
    refresh();
  }
  function moveLead(id, dir) {
    const l = leads().find(function (x) { return x.id === id; });
    if (!l) return;
    const next = STAGE_IDS[STAGE_IDS.indexOf(l.stage) + dir];
    if (next) setStage(id, next);
  }

  /* ---- Drawer ---- */
  const drawer = document.getElementById('leadDrawer');
  const backdrop = document.getElementById('drawerBackdrop');

  document.getElementById('drawerStage').innerHTML = STAGES.map(function (s) {
    return '<option value="' + s.id + '">' + s.label + '</option>';
  }).join('');

  function openDrawer(id) {
    const l = leads().find(function (x) { return x.id === id; });
    if (!l) return;
    openLeadId = id;
    document.getElementById('drawerAvatar').textContent = l.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('drawerName').textContent = l.name;
    document.getElementById('drawerMeta').textContent = 'Received ' + l.at + ' · ' + (l.status || '');
    document.getElementById('drawerStage').value = l.stage;
    document.getElementById('drawerNext').value = l.nextAction || '';
    document.getElementById('drawerContact').innerHTML =
      '<div><div class="grow"><b style="font-weight:600">Reach them</b><span>' + S.esc(l.contact) + '</span></div></div>' +
      '<div><div class="grow"><b style="font-weight:600">Parent’s city</b><span>' + S.esc(l.city || '—') + '</span></div></div>' +
      '<div><div class="grow"><b style="font-weight:600">Interest</b><span>' + S.esc(l.intent || '—') + '</span></div></div>';
    renderNotes(l);
    drawer.classList.add('open');
    backdrop.classList.add('open');
  }
  function renderNotes(l) {
    document.getElementById('drawerNotes').innerHTML = (l.notes && l.notes.length)
      ? l.notes.map(function (n) {
          return '<div class="note-item"><time>' + n.at + '</time><p>' + S.esc(n.text) + '</p></div>';
        }).join('')
      : '<p class="tiny muted">No notes yet — capture the fear, the decision-makers, the surprises.</p>';
  }
  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    openLeadId = null;
  }
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  document.getElementById('drawerStage').addEventListener('change', function () {
    if (openLeadId) { setStage(openLeadId, this.value); }
  });
  document.getElementById('drawerNext').addEventListener('change', function () {
    if (openLeadId) { SyaharStore.updateLead(openLeadId, { nextAction: this.value.trim() }); refresh(); }
  });
  document.getElementById('noteForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const input = document.getElementById('noteText');
    const text = input.value.trim();
    if (!text || !openLeadId) return;
    SyaharStore.addLeadNote(openLeadId, text);
    input.value = '';
    renderNotes(leads().find(function (x) { return x.id === openLeadId; }));
  });

  /* follow-up "Open" buttons (delegated, list re-renders) */
  document.getElementById('followUps').addEventListener('click', function (e) {
    const b = e.target.closest('[data-open]');
    if (b) openDrawer(b.dataset.open);
  });

  function refresh() { renderKpis(); renderFollowUps(); renderBoard(); }
  refresh();
})();
