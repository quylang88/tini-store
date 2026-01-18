// Service Worker for PWA
/* eslint-env serviceworker */

const CACHE_NAME = 'tiny-shop-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/tiny-shop-icon-iphone.png',
  '/tiny-shop.png',
  '/tiny-shop-transparent.png'
];

self.addEventListener("install", (event) => {
  // Pre-cache critical assets
  event.waitUntil(
    self.caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Pass through - mostly network first strategy handled by browser or Vite
  // But we could add offline support here later
});

// --- PUSH NOTIFICATION SUPPORT ---
self.addEventListener('push', function(event) {
  // Parse payload
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : 'Bạn có thông báo mới!' };
  }

  const title = data.title || 'Tiny Shop';
  const options = {
    body: data.body || 'Chào buổi sáng! Hãy kiểm tra cửa hàng của bạn.',
    icon: '/tiny-shop-icon-iphone.png',
    badge: '/tiny-shop.png',
    data: { url: '/' }, // URL to open
    tag: 'daily-greeting', // Prevent duplicates
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  // Focus existing window or open new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a window is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
