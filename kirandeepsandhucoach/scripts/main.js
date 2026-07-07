(function () {
  'use strict';

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Progressive-enhancement AJAX submit for Formspree forms.
  // Falls back to a normal POST + Formspree's own thank-you page if fetch fails.
  var forms = document.querySelectorAll('form[data-formspree]');
  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var statusEl = form.querySelector('.form-status');
      var submitBtn = form.querySelector('button[type="submit"]');
      var honeypot = form.querySelector('input[name="_gotcha"]');

      // Basic honeypot spam guard
      if (honeypot && honeypot.value) {
        return;
      }

      if (statusEl) {
        statusEl.textContent = 'Sending…';
        statusEl.className = 'form-status is-visible';
      }
      if (submitBtn) { submitBtn.disabled = true; }

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (response) {
          if (response.ok) {
            form.reset();
            if (statusEl) {
              statusEl.textContent = 'Thank you — your message has been sent. I’ll be in touch soon.';
              statusEl.className = 'form-status is-visible is-success';
            }
          } else {
            return response.json().then(function (data) {
              throw new Error((data && data.error) || 'Submission failed');
            });
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = 'Something went wrong. Please email kiran@leadershipkard.com directly.';
            statusEl.className = 'form-status is-visible is-error';
          }
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; }
        });
    });
  });
})();
