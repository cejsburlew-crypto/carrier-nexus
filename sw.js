const CACHE_NAME = 'carrier-nexus-v1';
const CORE_ASSETS = [
  '/carrier-nexus/',
  '/carrier-nexus/index.html',
  '/carrier-nexus/login.html',
  '/carrier-nexus/nexus-sidebar.js',
  '/carrier-nexus/nexus-config.js',
  '/carrier-nexus/nexus-db.js',
  '/carrier-nexus/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  
  if (url.hostname !== self.location.hostname) return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || new Response('Offline', {status: 503})))
  );
});
