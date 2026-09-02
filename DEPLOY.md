# Deploying the 66F Case Log as an installable app

**What this folder is:** a complete, self-contained Progressive Web App. Installs to the home
screen, runs fully offline, shows an unfinished-case badge on its own icon. **No app store, no
backend, no account.** Clinical data never leaves the device — there is no network endpoint in
this application at all.

```
pwa/
  index.html            the app (self-contained, 66F coin embedded)
  sw.js                 service worker — offline shell. BUMP `CACHE` ON EVERY DEPLOY
  manifest.webmanifest  install metadata, icons, shortcuts
  icons/                coin192 · coin512 · maskable512
```

## Why hosting is not optional

A service worker — and therefore offline install, home-screen installation and the icon badge —
**requires https and a real origin.** A `file://` copy cannot register one.

⚠️ **On iPhone this is the whole ballgame.** Safari can clear a normal browser tab's local storage
after roughly a week of not opening the site. **A home-screen-installed PWA is treated differently.**
If this is going on a phone, it must be installed, and to be installed it must be hosted.

## Recommended: GitHub Pages

Free, permanent, versioned, and it gives you the **one pinned origin** the data depends on.
You already have a GitHub account.

```bash
# from this pwa/ folder
git init
git add .
git commit -m "66F Case Log v3 PWA"
git branch -M main
git remote add origin https://github.com/<you>/66f-case-log.git
git push -u origin main
# then: repo Settings → Pages → Source: main, folder: / (root)
```

Lands at `https://<you>.github.io/66f-case-log/`.

⛔ **A public repo makes the app public — which is fine (no PHI, no data, just the instrument) —
but decide deliberately.** A private repo needs GitHub Pages on a paid plan.

## Installing on a phone

- **iPhone/iPad:** open the URL in **Safari** → Share → **Add to Home Screen**. Chrome on iOS
  cannot install PWAs.
- **Android:** Chrome offers "Install app," or Menu → Add to Home screen. The app shows its own
  install button when the browser allows it.

## ⛔ The rule that protects your data

**One URL. One device. Forever.**

Storage is per-origin. A different address is a different, empty log — your entries are not lost,
they are simply unreachable from the new address. Write the canonical URL in your notes and never
hand anyone a variant of it.

## Deploying an update

1. Edit `index.html`
2. **Bump `CACHE` in `sw.js`** (e.g. `66f-caselog-v3.0.1` → `v3.0.2`) — otherwise users keep the
   cached old version indefinitely
3. Commit and push
4. Users get the update on next open (may take one extra launch to activate)

⚠️ **Never change the schema and the cache name without thinking about existing data.** The app
refuses to import a backup written by a newer schema, but a live upgrade is on you: bump
`SCHEMA` in `index.html` only alongside a migration, and tell users to export first.

## Notifications — what is and is not possible

| Want | Reality |
|---|---|
| Badge on the app icon showing unfinished count | ✅ **Implemented.** Works on Android/Chrome and on iOS 16.4+ **for installed PWAs** |
| Prompt on opening the app | ✅ **Implemented** — banner with a "Finish now" button |
| A push notification at 20:00 saying "you have 3 unfinished" | ❌ **Not possible without a server.** Web push needs a push service and a backend; there is no reliable scheduled-local-notification API on the web. On iOS, push additionally requires the PWA to be installed |

If scheduled reminders ever become a hard requirement, that is the point at which this needs a
backend — and that is also the point at which it stops being a personal instrument and starts
needing the governance that comes with fielded software.
