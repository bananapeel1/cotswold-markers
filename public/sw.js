const CACHE_NAME = "trailtap-v5";
const DATA_CACHE = "trailtap-data-v5";
const MAP_CACHE = "trailtap-maps-v1";
const API_CACHE = "trailtap-api-v5";
const SYNC_STORE = "trailtap-pending-scans";

// Max map tiles to cache (prevent unbounded growth)
const MAX_MAP_TILES = 500;

// Precache essential assets
const PRECACHE_URLS = [
  "/data/markers.json",
  "/data/businesses.json",
  "/data/stories.json",
  "/data/pois.json",
  "/data/scan-counts.json",
  "/data/cotswold-way.geojson",
  "/manifest.json",
  "/offline.html",
];

// API endpoints to cache for offline use
const CACHEABLE_API_PATHS = [
  "/api/community/stats",
  "/api/scan",
  "/api/user/scans",
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
          .filter(
            (k) =>
              k !== CACHE_NAME &&
              k !== DATA_CACHE &&
              k !== MAP_CACHE &&
              k !== API_CACHE
          )
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Background Sync: queue scans when offline, replay when back online ──

async function savePendingScan(scanData) {
  const db = await openSyncDB();
  const tx = db.transaction(SYNC_STORE, "readwrite");
  tx.objectStore(SYNC_STORE).add({
    ...scanData,
    timestamp: Date.now(),
  });
  await new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = reject;
  });
  db.close();
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("trailtap-sync", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SYNC_STORE)) {
        db.createObjectStore(SYNC_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function replayPendingScans() {
  let db;
  try {
    db = await openSyncDB();
    const tx = db.transaction(SYNC_STORE, "readonly");
    const store = tx.objectStore(SYNC_STORE);
    const allScans = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (!allScans || allScans.length === 0) {
      db.close();
      return;
    }

    for (const scan of allScans) {
      try {
        const { id, timestamp, ...body } = scan;
        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok || res.status === 409) {
          // Successfully synced or already recorded — remove from queue
          const delTx = db.transaction(SYNC_STORE, "readwrite");
          delTx.objectStore(SYNC_STORE).delete(id);
          await new Promise((resolve) => {
            delTx.oncomplete = resolve;
          });
        }
      } catch {
        // Still offline for this one — leave it in the queue
        break;
      }
    }
    db.close();
  } catch {
    if (db) db.close();
  }
}

// Register for background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-scans") {
    event.waitUntil(replayPendingScans());
  }
});

// Also replay on connectivity restore (fallback for browsers without Background Sync)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "REPLAY_SCANS") {
    event.waitUntil(replayPendingScans());
  }
});

// ── Fetch handler ──

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Handle POST /api/scan — queue for background sync when offline
  if (url.pathname === "/api/scan" && event.request.method === "POST") {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        // Network failed — save for later sync
        const body = await event.request.json();
        await savePendingScan(body);

        // Request background sync
        if (self.registration.sync) {
          try {
            await self.registration.sync.register("sync-scans");
          } catch {
            // Background Sync not available — will replay on next online event
          }
        }

        return new Response(
          JSON.stringify({
            queued: true,
            message: "Scan saved offline. It will sync when you reconnect.",
          }),
          {
            status: 202,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  if (event.request.method !== "GET") return;

  // Mapbox map tiles: cache-first for offline map support
  if (
    url.hostname.includes("api.mapbox.com") ||
    url.hostname.includes("tiles.mapbox.com") ||
    url.hostname.includes("a.tiles.mapbox.com") ||
    url.hostname.includes("b.tiles.mapbox.com")
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            // Only cache successful tile responses
            if (response.ok) {
              const clone = response.clone();
              caches.open(MAP_CACHE).then(async (cache) => {
                // Evict oldest tiles if over limit
                const keys = await cache.keys();
                if (keys.length >= MAX_MAP_TILES) {
                  // Delete oldest 50 tiles to make room
                  const toDelete = keys.slice(0, 50);
                  await Promise.all(toDelete.map((k) => cache.delete(k)));
                }
                cache.put(event.request, clone);
              });
            }
            return response;
          })
      )
    );
    return;
  }

  // Mapbox static assets (sprites, glyphs, styles): cache-first
  if (
    url.hostname.includes("api.mapbox.com") &&
    (url.pathname.includes("/fonts/") ||
      url.pathname.includes("/sprites/") ||
      url.pathname.includes("/styles/"))
  ) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(MAP_CACHE).then((cache) =>
                cache.put(event.request, clone)
              );
            }
            return response;
          })
      )
    );
    return;
  }

  // API responses: network-first with cache fallback (community stats, scan counts, user scans)
  if (CACHEABLE_API_PATHS.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) =>
              cache.put(event.request, clone)
            );
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Data files: network-first with cache fallback
  if (url.pathname.startsWith("/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches
            .open(DATA_CACHE)
            .then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Marker pages + trail + sponsors: network first with 3s timeout, offline page fallback
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
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        }),
        new Promise((_, reject) => setTimeout(reject, 3000)),
      ]).catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match("/offline.html"))
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
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, clone));
            return response;
          })
      )
    );
    return;
  }
});
