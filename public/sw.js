const CACHE_NAME = "warehouse-cache-v3";

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/style.css",
  // thêm JS, icon nếu cần
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// ===============================
// FETCH — không cache API
// ===============================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // KHÔNG CACHE API
  if (url.pathname.startsWith("/api/")) {
    return; // luôn fetch từ server
  }

  // Cache-first cho file tĩnh
  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );

  self.clients.claim();
});
