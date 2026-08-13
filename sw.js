const APP_SCOPE = "/apps/healthy/";
const CACHE_NAME = "healthy-pro-web-__HEALTHY_PRO_BUILD_VERSION__";
const STATIC_ASSETS = [
  APP_SCOPE,
  `${APP_SCOPE}index.html`,
  `${APP_SCOPE}src/web/app.js?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}src/web/fixture.js?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}src/web/healthy-api.js?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}src/web/rocky-platform-client.js?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}src/web/view-model.js?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}src/web/styles.css?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}public/icon.svg?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}public/manifest.webmanifest?v=__HEALTHY_PRO_BUILD_VERSION__`,
  `${APP_SCOPE}public/assets/equipment/treadmill.png`,
  `${APP_SCOPE}public/assets/equipment/elliptical.png`,
  `${APP_SCOPE}public/assets/equipment/recumbent-bike.png`,
  `${APP_SCOPE}public/assets/equipment/rower.png`,
  `${APP_SCOPE}public/assets/equipment/chest-press.png`,
  `${APP_SCOPE}public/assets/equipment/lat-pulldown.png`,
  `${APP_SCOPE}public/assets/equipment/seated-row.png`,
  `${APP_SCOPE}public/assets/equipment/leg-press.png`,
  `${APP_SCOPE}public/assets/equipment/leg-extension-curl.png`,
  `${APP_SCOPE}public/assets/equipment/shoulder-press.png`,
  `${APP_SCOPE}public/assets/equipment/rear-delt.png`,
  `${APP_SCOPE}public/assets/equipment/assisted-pullup.png`,
  `${APP_SCOPE}public/assets/equipment/hack-squat.png`,
  `${APP_SCOPE}public/assets/equipment/cable-station.png`,
  `${APP_SCOPE}public/assets/equipment/hip-thrust.png`,
  `${APP_SCOPE}public/assets/equipment/dumbbell-rack.png`,
  `${APP_SCOPE}public/assets/web/smith-machine.jpg`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("healthy-pro-web-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(APP_SCOPE)) return;
  if (requestUrl.pathname.startsWith(`${APP_SCOPE}api/`)) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .catch(() => caches.match(`${APP_SCOPE}index.html`))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
