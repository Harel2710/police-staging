const CACHE_NAME = 'police-app-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './css/app.css',
  './js/state.js',
  './js/utils.js',
  './js/storage.js',
  './js/lessons.js',
  './js/auth.js',
  './js/dashboard.js',
  './js/quiz.js',
  './js/features.js',
  './js/admin.js',
  './js/init.js',
  './hebrew_data.js',
  './dpr_data.js',
  './exam_data.js',
  './manifest.json',
  './icon-192.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Network first strategy - only for GET requests
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  // Skip Firebase/API requests - don't cache them
  if (event.request.url.includes('firestore') || event.request.url.includes('googleapis')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
