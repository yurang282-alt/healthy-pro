const CACHE_NAME = "healthy-pro-mvp-v11";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/src/app.js?v=supabase-cloud-v1",
  "/src/cloud.js?v=supabase-v1",
  "/src/coach.js?v=model-v2",
  "/src/runtime-config.js?v=supabase-v1",
  "/src/styles.css?v=supabase-pwa-v1",
  "/public/icon.svg",
  "/public/manifest.webmanifest",
  "/public/assets/equipment-contact-sheet.png",
  "/public/assets/smith-machine.png",
  "/public/assets/equipment/assisted-pullup.png",
  "/public/assets/equipment/cable-station.png",
  "/public/assets/equipment/chest-press.png",
  "/public/assets/equipment/dumbbell-rack.png",
  "/public/assets/equipment/elliptical.png",
  "/public/assets/equipment/hack-squat.png",
  "/public/assets/equipment/hip-thrust.png",
  "/public/assets/equipment/lat-pulldown.png",
  "/public/assets/equipment/leg-extension-curl.png",
  "/public/assets/equipment/leg-press.png",
  "/public/assets/equipment/rear-delt.png",
  "/public/assets/equipment/recumbent-bike.png",
  "/public/assets/equipment/rower.png",
  "/public/assets/equipment/seated-row.png",
  "/public/assets/equipment/shoulder-press.png",
  "/public/assets/equipment/treadmill.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
