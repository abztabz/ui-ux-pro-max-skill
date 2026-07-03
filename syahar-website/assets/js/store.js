/* ============================================================
   Syahar demo data layer.
   Everything persists to localStorage so the demo behaves like
   a real product: leads captured on the landing page appear in
   the admin console; reports filed by the caregiver appear in
   the family's daily log.
   When porting to the app, replace this module with the real
   API client — the shape of these objects IS the API contract.
   ============================================================ */
(function () {
  const KEY = 'syahar.demo.v1';

  const seed = {
    users: [
      { id: 'u-family',    role: 'family',    name: 'Kiran Dhakal',  email: 'family@syahar.demo',    password: 'demo', country: 'United Kingdom', avatar: 'KD' },
      { id: 'u-caregiver', role: 'caregiver', name: 'Sita Gurung',   email: 'caregiver@syahar.demo', password: 'demo', city: 'Kathmandu', avatar: 'SG', verified: true, skills: ['Elder care', 'First aid', 'Medication support'] },
      { id: 'u-admin',     role: 'admin',     name: 'Care Coordinator', email: 'admin@syahar.demo',  password: 'demo', avatar: 'CC' }
    ],

    patient: {
      id: 'p-1', name: 'Maya Dhakal', age: 74, city: 'Kathmandu (Baneshwor)',
      plan: 'Care · Rs 32,000/mo', familyId: 'u-family', caregiverId: 'u-caregiver',
      conditions: ['Hypertension', 'Mild arthritis (knees)'],
      allergies: ['Penicillin'],
      bloodGroup: 'B+',
      doctor: 'Dr. R. Shrestha · Norvic Hospital · +977-1-4258554',
      emergencyContact: 'Hari Dhakal (nephew, Baneshwor) · +977-98XXXXXXXX',
      medications: [
        { name: 'Amlodipine 5mg', schedule: 'Morning, after food', purpose: 'Blood pressure' },
        { name: 'Calcium + D3',   schedule: 'Evening',             purpose: 'Bone health' },
        { name: 'Paracetamol 500mg', schedule: 'As needed, max 3/day', purpose: 'Knee pain' }
      ],
      vitalsHistory: [
        { date: offsetDate(-6), bp: '138/88', pulse: 76, weight: 58.4, mood: 'Cheerful' },
        { date: offsetDate(-4), bp: '134/86', pulse: 74, weight: 58.4, mood: 'Calm' },
        { date: offsetDate(-2), bp: '131/84', pulse: 72, weight: 58.6, mood: 'Cheerful' },
        { date: offsetDate(-1), bp: '129/82', pulse: 71, weight: 58.6, mood: 'Cheerful' }
      ],
      documents: [
        { name: 'Care agreement — signed', date: '2026-06-02', kind: 'Contract' },
        { name: 'Health assessment (day one)', date: '2026-06-05', kind: 'Medical' },
        { name: 'Caregiver vetting file — Sita G.', date: '2026-05-28', kind: 'Vetting' },
        { name: 'June invoice — paid', date: '2026-06-28', kind: 'Billing' }
      ]
    },

    reports: [
      {
        id: 'r-1', date: offsetDate(-2), caregiverId: 'u-caregiver', visit: 'Morning visit · 9:00–13:00',
        meals: 'Breakfast and lunch eaten well (dal bhat, fruit)', meds: 'All morning medication taken on time',
        mobility: '20-minute walk on the terrace, knees a little stiff', mood: 'Cheerful, told stories about Dashain',
        notes: 'BP 131/84. Aama asked to video-call Kiran on Saturday.', photoConsent: true
      },
      {
        id: 'r-2', date: offsetDate(-1), caregiverId: 'u-caregiver', visit: 'Morning visit · 9:00–13:00',
        meals: 'Good appetite; extra fruit at 11', meds: 'Taken on time; paracetamol NOT needed today',
        mobility: 'Walked to the corner shop and back, steady', mood: 'Cheerful',
        notes: 'BP 129/82, pulse 71. Knee pain clearly better this week.', photoConsent: true
      }
    ],

    messages: [
      { id: 'm-1', from: 'u-caregiver', at: offsetStamp(-1, '13:10'), text: 'Namaste Kiran ji — today went well. Aama walked to the corner shop with me, very steady. Full report filed.' },
      { id: 'm-2', from: 'u-family',    at: offsetStamp(-1, '18:42'), text: 'Thank you Sita didi, that photo made my whole day. Is her knee still hurting?' },
      { id: 'm-3', from: 'u-caregiver', at: offsetStamp(-1, '18:55'), text: 'Much better this week — she didn’t need the pain tablet today. She wants a video call with you on Saturday.' }
    ],

    visits: [
      { id: 'v-1', date: offsetDate(0), time: '9:00 – 13:00', patient: 'Maya Dhakal', address: 'Baneshwor, Kathmandu', status: 'today', tasks: ['Morning meds', 'Breakfast + lunch', 'Terrace walk', 'BP check'] },
      { id: 'v-2', date: offsetDate(1), time: '9:00 – 13:00', patient: 'Maya Dhakal', address: 'Baneshwor, Kathmandu', status: 'upcoming', tasks: ['Morning meds', 'Bath assistance', 'Doctor tele-consult 11:00'] },
      { id: 'v-3', date: offsetDate(2), time: '9:00 – 13:00', patient: 'Maya Dhakal', address: 'Baneshwor, Kathmandu', status: 'upcoming', tasks: ['Morning meds', 'Market walk', 'Weekly proof photos'] }
    ],

    leads: [
      { id: 'l-1', at: offsetStamp(-2, '10:14'), name: 'Prakash Thapa', contact: 'prakash.t@example.com', city: 'Pokhara', intent: 'I need care for a parent', status: 'Discovery call booked' },
      { id: 'l-2', at: offsetStamp(-1, '21:03'), name: 'Anita Rai', contact: '+44 77XX XXX XXX', city: 'Kathmandu', intent: 'I need care for a parent', status: 'New' },
      { id: 'l-3', at: offsetStamp(-1, '08:47'), name: 'Sunita Maharjan', contact: '+977 98XX XXX XXX', city: 'Lalitpur', intent: 'I want to provide care', status: 'Vetting scheduled' }
    ],

    alerts: [
      { id: 'a-1', at: offsetStamp(-3, '16:20'), level: 1, family: 'Dhakal family', text: 'Caregiver reschedule requested (festival). Backup confirmed — no gap.', resolved: true }
    ],

    caregiverRoster: [
      { name: 'Sita Gurung', area: 'Kathmandu', vetting: 'Complete', backup: 'Rama K.', families: 1 },
      { name: 'Rama Khadka', area: 'Kathmandu', vetting: 'Complete', backup: 'Sita G.', families: 1 },
      { name: 'Laxmi Tamang', area: 'Lalitpur', vetting: 'References pending', backup: '—', families: 0 }
    ],

    billing: {
      plan: 'Care', amount: 'Rs 32,000 / month', nextDue: offsetDate(12),
      split: [
        { name: 'Kiran Dhakal (you)', share: 'Rs 16,000 · £91', status: 'Paid' },
        { name: 'Bina Dhakal (sister, Sydney)', share: 'Rs 16,000 · A$172', status: 'Paid' }
      ],
      breakdown: [
        { label: 'Caregiver salary (pass-through)', value: 'Rs 24,960' },
        { label: 'Verification, coordination & backup bench', value: 'Rs 6,400' },
        { label: 'Payment & FX at cost', value: 'Rs 640' }
      ]
    }
  };

  function offsetDate(days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }
  function offsetStamp(days, time) { return offsetDate(days) + ' ' + time; }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* corrupted state falls through to reseed */ }
    const fresh = JSON.parse(JSON.stringify(seed));
    localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }

  function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }

  const Store = {
    get db() { return load(); },

    /* ---- auth ---- */
    login(email, password) {
      const u = load().users.find(
        (x) => x.email.toLowerCase() === String(email).trim().toLowerCase() && x.password === password
      );
      if (!u) return null;
      sessionStorage.setItem('syahar.session', JSON.stringify({ id: u.id, role: u.role, name: u.name, avatar: u.avatar }));
      return u;
    },
    logout() { sessionStorage.removeItem('syahar.session'); },
    session() {
      try { return JSON.parse(sessionStorage.getItem('syahar.session')); } catch (e) { return null; }
    },
    /* Redirect to login unless the signed-in role matches. */
    guard(role) {
      const s = this.session();
      if (!s || s.role !== role) { window.location.href = '../login.html'; return null; }
      return s;
    },

    /* ---- leads (landing page lead capture) ---- */
    addLead(lead) {
      const db = load();
      db.leads.unshift({
        id: 'l-' + Date.now(),
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'New',
        ...lead
      });
      save(db);
    },

    /* ---- caregiver daily reports ---- */
    addReport(report) {
      const db = load();
      db.reports.unshift({ id: 'r-' + Date.now(), date: offsetDate(0), caregiverId: 'u-caregiver', ...report });
      save(db);
    },

    /* ---- chat ---- */
    addMessage(fromId, text) {
      const db = load();
      const now = new Date();
      db.messages.push({
        id: 'm-' + Date.now(), from: fromId,
        at: now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5),
        text
      });
      save(db);
    },

    /* ---- emergency alerts ---- */
    addAlert(level, family, text) {
      const db = load();
      const now = new Date();
      db.alerts.unshift({
        id: 'a-' + Date.now(),
        at: now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5),
        level, family, text, resolved: false
      });
      save(db);
    },

    resetDemo() { localStorage.removeItem(KEY); }
  };

  window.SyaharStore = Store;
})();
