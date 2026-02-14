var CACHE_NAME = 'gp-tracker-v1';
var URLS_TO_CACHE = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Install — cache shell assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network-first for API calls, cache-first for static assets
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Always go network-first for Firebase / API requests
  if (url.indexOf('firestore.googleapis.com') !== -1 ||
      url.indexOf('firebaseauth') !== -1 ||
      url.indexOf('firebasestorage') !== -1 ||
      url.indexOf('googleapis.com/identitytoolkit') !== -1) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      var fetchPromise = fetch(event.request).then(function(response) {
        // Update cache with fresh copy
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return cached;
      });
      return cached || fetchPromise;
    })
  );
});
