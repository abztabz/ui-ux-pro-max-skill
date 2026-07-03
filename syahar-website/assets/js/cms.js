/* CMS backend — edits the content model, publishes to the store,
   the landing page applies it via cms-apply.js. */
(function () {
  const S = SyaharShell;
  const session = S.mount({
    role: 'admin',
    title: 'CMS',
    roleLabel: 'Care coordinator',
    nav: [
      { href: 'admin.html', icon: 'home',  label: 'Console' },
      { href: 'crm.html',   icon: 'users', label: 'CRM' },
      { href: 'cms.html',   icon: 'log',   label: 'CMS', active: true },
      { href: '../index.html', icon: 'heart', label: 'View site' }
    ]
  });
  if (!session) return;

  /* Working copy of the content model. */
  const content = SyaharStore.cms.get();
  const meta = content._meta;
  delete content._meta;

  const state = document.getElementById('publishState');
  function markDirty() {
    state.textContent = 'Unpublished changes.';
    state.className = 'publish-state dirty';
  }

  /* ---- Section tabs ---- */
  document.getElementById('cmsMenu').addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    document.querySelectorAll('.cms-menu button').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.cms-section').forEach(function (s) { s.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('sec-' + btn.dataset.section).classList.add('active');
  });

  /* ---- Simple bindings (hero + brand) ---- */
  function get(path) {
    return path.split('.').reduce(function (o, k) { return o[k]; }, content);
  }
  function set(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce(function (o, k) { return o[k]; }, content)[last] = value;
  }
  document.querySelectorAll('[data-bind]').forEach(function (el) {
    el.value = get(el.dataset.bind);
    el.addEventListener('input', function () { set(el.dataset.bind, el.value); markDirty(); });
  });

  /* ---- Stats ---- */
  const statsSec = document.getElementById('sec-stats');
  statsSec.innerHTML = content.stats.map(function (s, i) {
    return '<div class="cms-item"><div class="cms-item-head"><b>Stat ' + (i + 1) + '</b></div>' +
      '<div class="grid-2">' +
      '<div class="field"><label>Value</label><input data-stat="' + i + '" data-key="value" value="' + esc(s.value) + '"></div>' +
      '<div class="field"><label>Label</label><input data-stat="' + i + '" data-key="label" value="' + esc(s.label) + '"></div>' +
      '</div></div>';
  }).join('');
  statsSec.addEventListener('input', function (e) {
    const el = e.target;
    if (el.dataset.stat === undefined) return;
    content.stats[Number(el.dataset.stat)][el.dataset.key] = el.value;
    markDirty();
  });

  /* ---- Pricing ---- */
  const priceSec = document.getElementById('sec-pricing');
  priceSec.innerHTML = content.pricing.map(function (t, i) {
    return '<div class="cms-item"><div class="cms-item-head"><b>Tier ' + (i + 1) + (i === 1 ? ' · highlighted' : '') + '</b></div>' +
      '<div class="grid-3" style="grid-template-columns:1fr 1fr 1.4fr">' +
      '<div class="field"><label>Name</label><input data-tier="' + i + '" data-key="name" value="' + esc(t.name) + '"></div>' +
      '<div class="field"><label>Price (NPR)</label><input data-tier="' + i + '" data-key="npr" value="' + esc(t.npr) + '"></div>' +
      '<div class="field"><label>Suffix (period + FX)</label><input data-tier="' + i + '" data-key="approx" value="' + esc(t.approx) + '"></div>' +
      '</div></div>';
  }).join('') +
  '<p class="tiny muted">Feature bullets live in the page markup — edit copy-level pricing here; structural changes belong in code.</p>';
  priceSec.addEventListener('input', function (e) {
    const el = e.target;
    if (el.dataset.tier === undefined) return;
    content.pricing[Number(el.dataset.tier)][el.dataset.key] = el.value;
    markDirty();
  });

  /* ---- FAQ ---- */
  const faqWrap = document.getElementById('faqItems');
  function renderFaq() {
    faqWrap.innerHTML = content.faq.map(function (f, i) {
      return '<div class="cms-item" style="margin-bottom:12px">' +
        '<div class="cms-item-head"><b>Question ' + (i + 1) + '</b>' +
        '<button class="btn btn-ghost btn-sm" data-del="' + i + '" type="button">Remove</button></div>' +
        '<div class="field"><label>Question</label><input data-faq="' + i + '" data-key="q" value="' + esc(f.q) + '"></div>' +
        '<div class="field"><label>Answer</label><textarea data-faq="' + i + '" data-key="a" rows="3">' + esc(f.a) + '</textarea></div>' +
        '</div>';
    }).join('');
  }
  renderFaq();
  faqWrap.addEventListener('input', function (e) {
    const el = e.target;
    if (el.dataset.faq === undefined) return;
    content.faq[Number(el.dataset.faq)][el.dataset.key] = el.value;
    markDirty();
  });
  faqWrap.addEventListener('click', function (e) {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    content.faq.splice(Number(b.dataset.del), 1);
    renderFaq();
    markDirty();
  });
  document.getElementById('addFaq').addEventListener('click', function () {
    content.faq.push({ q: 'New question', a: 'Answer in plain, honest language.' });
    renderFaq();
    markDirty();
    faqWrap.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---- Publish / revert ---- */
  document.getElementById('publishBtn').addEventListener('click', function () {
    const btn = this;
    btn.disabled = true; btn.textContent = 'Publishing…';
    setTimeout(function () {
      SyaharStore.cms.publish(content);
      btn.disabled = false; btn.textContent = 'Publish changes';
      state.textContent = 'Published ' + new Date().toTimeString().slice(0, 5) + ' — the landing page is updated.';
      state.className = 'publish-state done';
    }, 600);
  });

  document.getElementById('revertBtn').addEventListener('click', function () {
    if (!confirm('Reset all landing-page content to the shipped defaults?')) return;
    SyaharStore.cms.reset();
    window.location.reload();
  });

  if (meta && meta.publishedAt) {
    state.textContent = 'Last published ' + meta.publishedAt + '.';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
