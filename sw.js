const CACHE_NAME = "workout-v5";
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "https://cdn.tailwindcss.com",
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap",
  "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js",
];

// Install the service worker and cache the static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
});

// Serve cached content when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// Handle push events (for server-sent notifications)
// Note: This part is for true push notifications which require a push server.
// The current implementation uses setTimeout in script.js for scheduled notifications.
self.addEventListener("push", (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
  });
});
