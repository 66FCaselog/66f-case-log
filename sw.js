/* 66F Case Log — service worker.
   Offline-first with a cache-busting version. BUMP CACHE ON EVERY DEPLOY.

   ⛔ This worker caches the APP SHELL ONLY. It never touches clinical data —
   entries live in localStorage + IndexedDB on the device and are never
   transmitted anywhere. There is no network endpoint in this application. */

const CACHE = "66f-caselog-v3.6.3-firstrun"; /* v3.6.3: nothing saves before Setup (gate replaces the
   banner); first-run checklist (Setup · installed · one export · one test restore · reminder); "My month"
   counts card on Data; exports carry deleted ids and merge_v3/build_dashboard honour them.
   v3.6.2: second-pass fixes — persisted deletion tombstones
   (a deleted record cannot come back via a second window, a reboot, a stale mirror or an old backup);
   newest revision wins on every merge path; finishing a stub hydrates its own attributes; unsaved
   draft protected; blank "complete" refused; strict numeric form fields; import normalises every
   consumed field and recomputes acuity; two more HTML sinks made inert; ICTL count bounded.
   v3.6.1: audit fixes — edits no longer restamp
   today's site/rank/billet/ceiling onto old records; cross-instance save union (two open windows
   could erase each other); canary is now a high-water mark; imported text is HTML-escaped; import
   validates kind/date/version and rejects duplicate ids; acuity coerces numbers and whitelists
   qualifying circumstances; a CSV no longer clears the backup alarm; the form is cleared before
   finishing a stub; the date box no longer sticks after an edit; SW install fails loudly and
   deletes only its own caches.
   v3.6.0: no-case day TYPES (clinical/float/admin/training/leave), rank + duty position stamped on records, deployed site split FRSD/ARST/FH.
   v3.5.5: local-date stamping (UTC bug), import validation + cross-logger guard, ICTL double-count guard, cascade delete, zero-day idempotence, full records browser, share-sheet export, iOS pre-install storage warning, update banner */
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
  /* ⛔ NO .catch() here, deliberately. Swallowing an addAll failure turned a
     half-downloaded shell into a "successful" install — and activate below then
     deleted the cache that still worked, leaving the app with no offline copy at
     all. Letting install REJECT keeps the previous worker and its good cache. */
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      /* delete only OUR old caches. github.io serves every repo of an account from
         one origin, so an unfiltered sweep would evict other apps' caches too. */
      .then(ks => Promise.all(ks.filter(k => k.startsWith("66f-caselog-") && k !== CACHE)
                                .map(k => caches.delete(k))))
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
