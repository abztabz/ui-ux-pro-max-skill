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

  // CMS content: apply saved text, photos, and photo strips, if set.
  var editable = document.querySelectorAll('[data-edit]');
  var editableImgs = document.querySelectorAll('[data-edit-img]');
  var photoStrips = document.querySelectorAll('[data-photo-strip]');
  if (editable.length || editableImgs.length || photoStrips.length) {
    fetch('data/pages.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;

        editable.forEach(function (el) {
          var key = el.getAttribute('data-edit');
          if (data[key] != null && String(data[key]).trim() !== '') {
            el.innerHTML = data[key];
          }
        });

        editableImgs.forEach(function (img) {
          var key = img.getAttribute('data-edit-img');
          if (data[key] != null && String(data[key]).trim() !== '') {
            img.src = data[key];
            img.hidden = false;
            var frame = img.closest('.hero-portrait');
            if (frame) { frame.classList.add('has-photo'); }
          }
        });

        var stripsWithPhotos = [];
        photoStrips.forEach(function (strip) {
          var key = strip.getAttribute('data-photo-strip');
          var srcs = (data[key] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
          if (srcs.length) { stripsWithPhotos.push({ strip: strip, srcs: srcs }); }
        });
        if (!stripsWithPhotos.length) return;

        // Captions live in the gallery manifest — look them up per photo.
        fetch('data/gallery.json', { cache: 'no-cache' })
          .then(function (r) { return r.ok ? r.json() : []; })
          .catch(function () { return []; })
          .then(function (gallery) {
            var captions = {};
            gallery.forEach(function (g) { captions[g.src] = g.caption || ''; });
            stripsWithPhotos.forEach(function (item) {
              item.srcs.forEach(function (src) {
                var fig = document.createElement('figure');
                fig.className = 'gallery-item';
                var img = document.createElement('img');
                img.src = src;
                img.alt = captions[src] || 'Photo';
                img.loading = 'lazy';
                fig.appendChild(img);
                if (captions[src]) {
                  var cap = document.createElement('figcaption');
                  cap.textContent = captions[src];
                  fig.appendChild(cap);
                }
                item.strip.appendChild(fig);
              });
              var section = item.strip.closest('section');
              if (section) { section.hidden = false; }
            });
          });
      })
      .catch(function () { /* keep the HTML defaults if the fetch fails */ });
  }
})();
