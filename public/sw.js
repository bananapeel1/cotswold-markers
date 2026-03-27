const CACHE_NAME = "trailtap-v3";
const DATA_CACHE = "trailtap-data-v3";

// Precache essential assets
const PRECACHE_URLS = [
  "/data/markers.json",
  "/data/businesses.json",
  "/data/stories.json",
  "/data/pois.json",
  "/data/scan-counts.json",
  "/data/cotswold-way.geojson",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(DATA_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== DATA_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;

  // Data files: network-first with cache fallback
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(DATA_CACHE).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Marker pages + trail + sponsors: network first with 3s timeout
  if (
    url.pathname.startsWith("/m/") ||
    url.pathname === "/trail" ||
    url.pathname === "/sponsors" ||
    url.pathname === "/"
  ) {
    event.respondWith(
      Promise.race([
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }),
        new Promise((_, reject) => setTimeout(reject, 3000)),
      ]).catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ||
            new Response(
              '<html><body style="font-family:sans-serif;text-align:center;padding:4rem 1rem"><h1>You\'re offline</h1><p>This page will load when you have signal again.</p></body></html>',
              { headers: { "Content-Type": "text/html" } }
            )
        )
      )
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): cache-first
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.match(/\.(js|css|woff2?|png|jpg|svg|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            return response;
          })
      )
    );
    return;
  }
});
