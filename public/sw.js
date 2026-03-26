// BP Tracker Service Worker v1.7.1
const CACHE_NAME = "bp-tracker-v1.7.1";
const STATIC_ASSETS = ["/", "/index.html", "/static/js/main.chunk.js", "/static/js/bundle.js", "/manifest.json"];

// Install — cache static assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate — clear old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Network first, fallback to cache
self.addEventListener("fetch", (e) => {
  // ไม่ cache Google Fonts และ external APIs
  if (e.request.url.includes("fonts.googleapis") ||
      e.request.url.includes("script.google.com") ||
      e.request.url.includes("cdnjs.cloudflare") ||
      e.request.method !== "GET") {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
