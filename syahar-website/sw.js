/* Syahar service worker — offline-capable demo shell.
   Network-first for pages/scripts/styles (so updates show up on
   the next load), cache fallback when offline. Bump to invalidate. */
const CACHE = 'syahar-v4';
const CORE = [
  './', 'index.html', 'login.html', 'signup.html',
  'app/family.html', 'app/caregiver.html', 'app/admin.html', 'app/crm.html', 'app/cms.html',
  'assets/css/tokens.css', 'assets/css/base.css', 'assets/css/landing.css', 'assets/css/app.css',
  'assets/js/store.js', 'assets/js/app.js', 'assets/js/landing.js', 'assets/js/cms-apply.js',
  'assets/js/family.js', 'assets/js/caregiver.js', 'assets/js/admin.js', 'assets/js/crm.js', 'assets/js/cms.js',
  'assets/leads-template.csv', 'manifest.webmanifest'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  /* Network-first: always try for the freshest copy, keep the cache
     updated, and only fall back to cache when offline. */
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
