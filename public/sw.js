// KasiPool service worker: makes the installed app open fast and show a friendly page offline.
// It only caches our own files. Supabase, maps and other sites always go to the network, so
// pools, orders and payments are never shown from an old copy.
const STATIC = "kp-static-v1";
const OFFLINE = "kp-offline-v1";
const OFFLINE_URL = "/offline.html";
const MAX_STATIC = 150;
const LOCAL = ["localhost", "127.0.0.1"].includes(self.location.hostname);

// Last resort if the phone has cleared the saved offline page
const offlineFallback = () =>
  new Response("<h1>No internet connection</h1><p>Check your data or Wi-Fi, then try again.</p>", {
    status: 503,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE)
      .then((cache) => cache.add(OFFLINE_URL))
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

/** Saves a copy without ever failing the request (a full phone or a partial response just skips it) */
function save(cache, req, res) {
  if (res.status !== 200) return;
  cache
    .put(req, res.clone())
    .then(() => trim(cache))
    .catch(() => {});
}

async function fromCache(req) {
  try {
    const cache = await caches.open(STATIC);
    return { cache, hit: await cache.match(req) };
  } catch {
    return { cache: null, hit: undefined };
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: always fresh from the network, the offline page when there is no connection
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match(OFFLINE_URL)) ?? offlineFallback()),
    );
    return;
  }

  // Built files get a new name for every version: once downloaded, serve them from the phone.
  // Not on a developer's machine: `next dev` reuses file names
  if (url.pathname.startsWith("/_next/static/") && !LOCAL) {
    event.respondWith(
      fromCache(req).then(async ({ cache, hit }) => {
        if (hit) return hit;
        const res = await fetch(req);
        if (cache) save(cache, req, res);
        return res;
      }),
    );
    return;
  }

  // Pictures and icons can be replaced under the same name: show the saved copy straight away
  // and fetch the new one in the background for next time
  if (url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      fromCache(req).then(({ cache, hit }) => {
        const fresh = fetch(req).then((res) => {
          if (cache) save(cache, req, res);
          return res;
        });
        if (!hit) return fresh;
        event.waitUntil(fresh.catch(() => {}));
        return hit;
      }),
    );
  }
});
