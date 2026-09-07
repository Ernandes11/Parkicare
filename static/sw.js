// ParkiCare Service Worker
const CACHE_NAME = 'parkicare-v2';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys.map((k) => caches.delete(k)));
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Sempre priorizar rede para garantir que atualizações do Render apareçam imediatamente
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
