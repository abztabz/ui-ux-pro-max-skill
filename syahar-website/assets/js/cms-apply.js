/* Applies published CMS content to the landing page on load.
   In production this is the CMS render step (SSG rebuild or API);
   here it reads the published content from the demo store. */
(function () {
  if (!window.SyaharStore || !SyaharStore.cms) return;
  const c = SyaharStore.cms.get();

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el && text) el.textContent = text;
  }

  /* Hero */
  setText('heroKicker', c.hero.kicker);
  setText('heroTitle', c.hero.title);
  setText('heroLead', c.hero.lead);

  /* Stats */
  const stats = document.querySelectorAll('#statStrip .stat');
  c.stats.forEach(function (s, i) {
    if (!stats[i]) return;
    stats[i].querySelector('b').textContent = s.value;
    stats[i].querySelector('span').textContent = s.label;
  });

  /* Pricing (name + amount; feature lists stay in markup) */
  const cards = document.querySelectorAll('#pricingGrid .price-card');
  c.pricing.forEach(function (t, i) {
    if (!cards[i]) return;
    cards[i].querySelector('h3').textContent = t.name;
    cards[i].querySelector('.amount b').textContent = t.npr;
    cards[i].querySelector('.amount span').textContent = ' ' + t.approx;
  });

  /* FAQ — rebuilt from content */
  const faq = document.getElementById('faqList');
  if (faq && c.faq && c.faq.length) {
    faq.innerHTML = c.faq.map(function (item) {
      return '<details><summary>' + esc(item.q) + '</summary><p>' + esc(item.a) + '</p></details>';
    }).join('');
  }

  /* Footer golden rule */
  setText('goldenQuote', c.golden);
})();
