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
      { id: 'l-1', at: offsetStamp(-2, '10:14'), name: 'Prakash Thapa', contact: 'prakash.t@example.com', city: 'Pokhara', intent: 'I need care for a parent', status: 'Discovery call booked', stage: 'qualify',
        nextAction: 'Discovery call ' + offsetDate(1) + ' 19:00 UK', notes: [{ at: offsetStamp(-2, '11:00'), text: 'Father, 81, post-stroke. Two siblings in UK + Australia — wants sibling split. Fear: falls at night.' }] },
      { id: 'l-2', at: offsetStamp(-1, '21:03'), name: 'Anita Rai', contact: '+44 77XX XXX XXX', city: 'Kathmandu', intent: 'I need care for a parent', status: 'New', stage: 'enquiry',
        nextAction: 'Acknowledge on WhatsApp (24h SLA)', notes: [] },
      { id: 'l-3', at: offsetStamp(-1, '08:47'), name: 'Sunita Maharjan', contact: '+977 98XX XXX XXX', city: 'Lalitpur', intent: 'I want to provide care', status: 'Vetting scheduled', stage: 'match',
        nextAction: 'Video screen Friday 14:00', notes: [{ at: offsetStamp(-1, '09:30'), text: 'Agency referral. 6 yrs elder-care experience. Documents requested.' }] },
      { id: 'l-4', at: offsetStamp(-4, '13:26'), name: 'Deepak Shrestha', contact: 'deepak.s@example.com', city: 'Kathmandu', intent: 'I need care for a parent', status: 'Intro call scheduled', stage: 'intro',
        nextAction: 'Three-way intro call ' + offsetDate(2) + ' (keystone — never rush the parent)', notes: [{ at: offsetStamp(-3, '10:05'), text: 'Mother hesitant. Respected aunt will join the call. Do NOT push for a fast yes.' }] }
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

    /* ---- leads (landing page lead capture + CRM) ---- */
    addLead(lead) {
      const db = load();
      db.leads.unshift({
        id: 'l-' + Date.now(),
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        status: 'New',
        stage: 'enquiry',
        nextAction: 'Acknowledge within 24 hours (SOP 1)',
        notes: [],
        ...lead
      });
      save(db);
    },

    updateLead(id, patch) {
      const db = load();
      const lead = db.leads.find(function (l) { return l.id === id; });
      if (!lead) return;
      Object.assign(lead, patch);
      save(db);
    },

    addLeadNote(id, text) {
      const db = load();
      const lead = db.leads.find(function (l) { return l.id === id; });
      if (!lead) return;
      lead.notes = lead.notes || [];
      lead.notes.unshift({
        at: new Date().toISOString().slice(0, 16).replace('T', ' '),
        text: text
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

    resetDemo() { localStorage.removeItem(KEY); localStorage.removeItem(CMS_KEY); }
  };

  /* ============================================================
     CMS content layer — what the landing page renders.
     Defaults mirror index.html; the CMS backend edits and
     publishes overrides, cms-apply.js applies them on load.
     In production this becomes the CMS API / static rebuild.
     ============================================================ */
  const CMS_KEY = 'syahar.cms.v1';

  const cmsDefaults = {
    hero: {
      kicker: 'Verified care for the parents left behind',
      title: 'Be there for your parents — even from an ocean away.',
      lead: 'Syahar places vetted, insured caregivers with your ageing parents in Nepal — and sends you verified proof of every visit. Managed and paid entirely from abroad.'
    },
    stats: [
      { value: '3.5M+',    label: 'Nepalis working abroad with family at home' },
      { value: '100%',     label: 'of visits verified with a same-day report' },
      { value: '< 24 hrs', label: 'from enquiry to a coordinator call' },
      { value: '0',        label: 'parents ever left unattended by a staffing gap' }
    ],
    pricing: [
      { name: 'Lite',      npr: 'Rs 9,000',  approx: '/mo · ≈ £51 · $68' },
      { name: 'Care',      npr: 'Rs 32,000', approx: '/mo · ≈ £183 · $240' },
      { name: 'Full Care', npr: 'Rs 72,000', approx: '/mo · ≈ £411 · $540' }
    ],
    faq: [
      { q: 'How do I know the caregiver is trustworthy?',
        a: 'Every caregiver passes hard-stop vetting: government photo ID, a police background check dated within 12 months, two references we actually called, a health check and insurance cover. If any item is missing, they don’t join — no exceptions, even under supply pressure. And your parent meets them on video, with you on the call, before any visit happens.' },
      { q: 'What if my parent doesn’t want a stranger in the house?',
        a: 'That’s why the three-way introduction call exists. Your parent meets the caregiver on video with you present, asks anything they want, and gives their own yes — in their own words. If they hesitate, we don’t push: we offer a second call, a different caregiver, or a shorter trial. We never place a caregiver a parent hasn’t met and accepted.' },
      { q: 'What happens in an emergency?',
        a: 'Every placement runs a printed, severity-graded emergency protocol. In a medical emergency the caregiver gets your parent help immediately — before anything else — then you’re informed with a plan, never left to find out alone. Urgent-but-stable issues reach you the same day with a clear next step. And a backup caregiver means a staffing gap never leaves your parent unattended.' },
      { q: 'Is this a money-transfer service?',
        a: 'No — and it never will be. Syahar is a caregiver platform. Payment rails are plumbing we use so you can pay in your own currency; the product is verified care and your peace of mind. Your money buys presence and proof, not a wire.' },
      { q: 'What if it doesn’t work out?',
        a: 'Your first placement is money-back guaranteed, there’s no lock-in, and your first week is free. If a match isn’t right we replace the caregiver with a proper video introduction — never a cold swap — with overlap visits so your parent is never handed to a stranger.' }
    ],
    golden: '"We sell peace of mind, not money transfer."'
  };

  Store.cms = {
    defaults() { return JSON.parse(JSON.stringify(cmsDefaults)); },
    get() {
      try {
        const raw = localStorage.getItem(CMS_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          /* merge over defaults so new fields never come up empty */
          return Object.assign(this.defaults(), saved.content, { _meta: saved.meta });
        }
      } catch (e) { /* fall through to defaults */ }
      return this.defaults();
    },
    publish(content) {
      localStorage.setItem(CMS_KEY, JSON.stringify({
        content: content,
        meta: { publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }
      }));
    },
    reset() { localStorage.removeItem(CMS_KEY); }
  };

  window.SyaharStore = Store;
})();
