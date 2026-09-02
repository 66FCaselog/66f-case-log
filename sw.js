/* 66F Case Log — service worker.
   Offline-first with a cache-busting version. BUMP CACHE ON EVERY DEPLOY.

   ⛔ This worker caches the APP SHELL ONLY. It never touches clinical data —
   entries live in localStorage + IndexedDB on the device and are never
   transmitted anywhere. There is no network endpoint in this application. */

const CACHE = "66f-caselog-v3.5.2"; /* v3.5.2: CPT table 175 codes, descriptions from CMS PFS short descriptors, synonyms on every row */
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/coin192.png",
  "./icons/coin512.png",
  "./icons/maskable512.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first for the shell; network only as a fallback. The app must work
   in an OR with no signal, so a failed fetch must never break navigation. */
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req)
        .then(res => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() =>
          req.mode === "navigate" ? caches.match("./index.html") : new Response("", { status: 504 })
        );
    })
  );
});

/* The page asks the worker to refresh the icon badge when the
   unfinished count changes (some platforms only honour it from here). */
self.addEventListener("message", e => {
  const d = e.data || {};
  if (d.type === "badge" && self.navigator && self.navigator.setAppBadge) {
    if (d.count > 0) self.navigator.setAppBadge(d.count).catch(() => {});
    else if (self.navigator.clearAppBadge) self.navigator.clearAppBadge().catch(() => {});
  }
});
