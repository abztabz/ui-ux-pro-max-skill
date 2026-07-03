/* Landing page behaviour: mobile nav + lead capture. */
(function () {
  /* Mobile nav */
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');
  toggle.addEventListener('click', function () {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
  });

  /* Lead capture — validates, persists to the demo store (visible
     in the admin console), then shows the success state. */
  const form = document.getElementById('leadForm');
  const card = document.getElementById('lead');
  const submit = document.getElementById('leadSubmit');

  function fieldOf(input) { return input.closest('.field'); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('leadName');
    const contact = document.getElementById('leadContact');
    const city = document.getElementById('leadCity');
    let ok = true;

    [name, contact].forEach(function (input) {
      const valid = input.value.trim().length > 1;
      fieldOf(input).classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    if (!ok) return;

    submit.disabled = true;
    submit.textContent = 'Sending…';

    /* Simulate a network round-trip so the loading state is honest. */
    setTimeout(function () {
      SyaharStore.addLead({
        name: name.value.trim(),
        contact: contact.value.trim(),
        city: city.value.trim() || '—',
        intent: form.querySelector('input[name="intent"]:checked').value
      });
      card.classList.add('submitted');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 700);
  });

  [document.getElementById('leadName'), document.getElementById('leadContact')].forEach(function (input) {
    input.addEventListener('input', function () { fieldOf(input).classList.remove('invalid'); });
  });
})();
