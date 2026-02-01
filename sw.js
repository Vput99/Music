self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through strategy for now.
  // In a real production app, you would cache assets here.
  event.respondWith(fetch(event.request));
});