const CACHE_NAME = 'carrier-nexus-v1';
const CACHE_URLS = [
  '/carrier-nexus/',
  '/carrier-nexus/driver-command.html',
  '/carrier-nexus/driver-intake.html',
  '/carrier-nexus/dot-compliance.html',
  '/carrier-nexus/my-pay.html',
  '/carrier-nexus/driver-services.html',
  '/carrier-nexus/nexus-core.js',
  '/carrier-nexus/nexus-sidebar.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(CACHE_URLS.map(url => cache.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      }).catch(() => caches.match(event.request).then(cached => {
        if (cached) return cached;
        return new Response(
          '<html><body style="font-family:sans-serif;padding:2rem;background:#1a2744;color:white"><h2>You are offline</h2><p>Connect to the internet to use Carrier Nexus.</p><a href="driver-command.html" style="color:#00d4aa">Driver Command</a></body></html>',
          {headers: {'Content-Type': 'text/html'}}
        );
      }))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
