// Versi cache baru
const CACHE_NAME = 'kasir-bazaar-cache-v2';

// Daftar file aplikasi lokal yang akan disimpan
// Pastikan path-nya benar sesuai nama repository Anda
const urlsToCache = [
  '/BAZAR-PERCA-UH/',
  '/BAZAR-PERCA-UH/index.html',
  '/BAZAR-PERCA-UH/manifest.json',
  '/BAZAR-PERCA-UH/icon.png'
  // Kita tidak cache file-file Firebase/Tailwind karena mereka dari server eksternal
];

// Event 'install': Dijalankan saat service worker pertama kali diinstal
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Menambahkan semua file penting ke dalam cache
        return cache.addAll(urlsToCache);
      })
  );
  // Hapus cache lama
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

// Event 'fetch': Dijalankan setiap kali ada permintaan resource
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1. Jika ini request ke GStatic atau Firebase, SELALU ke jaringan.
  // Ini PENTING agar koneksi real-time tidak terganggu oleh cache.
  if (requestUrl.hostname === 'firestore.googleapis.com' || 
      requestUrl.hostname === 'www.gstatic.com') {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. Untuk file aplikasi lokal, gunakan strategi Cache-First
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika resource ditemukan di cache, kembalikan dari cache
        if (response) {
          return response;
        }

        // Jika tidak ada, ambil dari jaringan (internet)
        return fetch(event.request).then(
          networkResponse => {
            // Cek jika response valid
            if(!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Periksa apakah request berasal dari domain kita sendiri sebelum caching
            if (requestUrl.origin === self.location.origin) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          }
        );
      }
    )
  );
});

