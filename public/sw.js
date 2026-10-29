// KasiPool service worker: makes the installed app open fast and show a friendly page offline.
// It only caches our own files. Supabase, maps and other sites always go to the network, so
// pools, orders and payments are never shown from an old copy.
const STATIC = "kp-static-v1";
const OFFLINE = "kp-offline-v1";
const OFFLINE_URL = "/offline.html";
const MAX_STATIC = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icons/icon-192.png"]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC && k !== OFFLINE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Keeps the static cache from growing forever across deploys (oldest entries go first) */
async function trim(cache) {
  const keys = await cache.keys();
  await Promise.all(
    keys.slice(0, Math.max(0, keys.length - MAX_STATIC)).map((k) => cache.delete(k)),
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: always fresh from the network, the offline page when there is no connection
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Built files have a new name for every version, and product pictures and icons rarely
  // change: serve them from the phone once downloaded, which saves data
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) {
          await cache.put(req, res.clone());
          trim(cache);
        }
        return res;
      }),
    );
  }
});
