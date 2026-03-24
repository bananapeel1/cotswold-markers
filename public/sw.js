const CACHE_NAME = "cw-markers-v1";
const DATA_CACHE = "cw-data-v1";

// Cache data files on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(DATA_CACHE).then((cache) =>
      cache.addAll([
        "/data/markers.json",
        "/data/businesses.json",
        "/data/stories.json",
        "/data/pois.json",
        "/data/scan-counts.json",
        "/data/cotswold-way.geojson",
      ])
    )
  );
  self.skipWaiting();
});

// Clean old caches
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

// Network-first for marker pages, stale-while-revalidate for data
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Data files: stale-while-revalidate
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      caches.open(DATA_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Marker pages: network first with 3s timeout, fallback to cache
  if (url.pathname.startsWith("/m/")) {
    event.respondWith(
      Promise.race([
        fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }),
        new Promise((_, reject) => setTimeout(reject, 3000)),
      ]).catch(() => caches.match(event.request))
    );
    return;
  }
});
