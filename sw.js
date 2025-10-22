const CACHE_NAME = 'bazaar-kasir-cache-v1';
const urlsToCache = [
  '/BAZAR-PERCA-UH/',
  '/BAZAR-PERCA-UH/index.html',
  '/BAZAR-PERCA-UH/manifest.json',
  '/BAZAR-PERCA-UH/icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting(); 
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.protocol.startsWith('http')) {
    if (requestUrl.origin === location.origin || 
        requestUrl.origin === 'https://cdn.tailwindcss.com' ||
        requestUrl.origin === 'https://fonts.googleapis.com' ||
        requestUrl.origin === 'https://fonts.gstatic.com') {
      
      event.respondWith(
        caches.match(event.request)
          .then(response => {
            if (response) {
              return response; 
            }
            
            return fetch(event.request).then(
              networkResponse => {
                if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                  return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
                return networkResponse;
              }
            );
          }
        ).catch(() => {
          if (event.request.mode === 'navigate' && event.request.method === 'GET') {
            return caches.match('/BAZAR-PERCA-UH/index.html');
          }
        })
      );
    }
  }
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

