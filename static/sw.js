// ParkiCare Service Worker
const CACHE_NAME = 'parkicare-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Pass-through network strategy for fresh API calls
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
