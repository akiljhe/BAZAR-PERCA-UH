const CACHE_NAME = 'bazaar-kasir-cache-v1';
// Daftar file yang akan disimpan di cache
// Path ini HARUS sesuai dengan struktur repository GitHub Pages Anda
const CACHE_FILES = [
    '/BAZAR-PERCA-UH/', // Ini adalah index.html
    '/BAZAR-PERCA-UH/manifest.json',
    '/BAZAR-PERCA-UH/icon.png'
    // Kita tidak meng-cache file script utama karena itu adalah modul
    // dan kita tidak meng-cache resource dari cdn (tailwind, firebase)
];

// Instalasi Service Worker: menyimpan file-file di atas ke cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('ServiceWorker: Cache dibuka, menambahkan file...');
                return cache.addAll(CACHE_FILES);
            })
            .catch(err => {
                console.error('ServiceWorker: Gagal menambahkan file ke cache', err);
            })
    );
});

// Aktivasi Service Worker: membersihkan cache lama (jika ada)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('ServiceWorker: Menghapus cache lama', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch (Pengambilan) Event:
// Ini adalah strategi "Cache first, falling back to network"
// TAPI, kita harus MENGABAIKAN request ke Firebase/Firestore
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // --- PENTING ---
    // Jangan cache request ke API Firebase atau Google.
    // Biarkan request ini langsung ke network.
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com')) {
        // Biarkan request ini berjalan seperti biasa (network)
        return;
    }

    // Untuk semua request lainnya (HTML, manifest, icon)
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Jika file ditemukan di cache, kembalikan dari cache
                if (response) {
                    return response;
                }
                
                // Jika tidak ada di cache, coba ambil dari network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // (Opsional) Kita bisa simpan response baru ini ke cache
                        // Tapi untuk file utama kita, kita sudah cache saat install
                        return networkResponse;
                    })
                    .catch(() => {
                        console.error('ServiceWorker: Gagal mengambil dari network', event.request.url);
                        // Anda bisa menampilkan halaman offline custom di sini jika mau
                    });
            })
    );
});

