const CACHE_NAME = "healthy-pro-mvp-v7";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/app.js",
  "/src/coach.js",
  "/src/styles.css",
  "/public/icon.svg",
  "/public/manifest.webmanifest",
  "/public/assets/equipment-contact-sheet.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
