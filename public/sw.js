/* ManaBrand service worker — makes the site installable and keeps it usable on a bad connection.
 *  - Pages are always fetched from the network (logged-in content is never served stale from here);
 *    if the network is down, a friendly /offline page is shown instead.
 *  - Built files (JS / CSS / fonts), icons and the logo are cached for fast repeat loads.
 *  - Nothing private is ever stored: no API calls, no sign-in, no admin / seller pages, no POSTs. */
const VERSION = "mana-v1";
const STATIC = `${VERSION}-static`;
const SHELL = ["/offline", "/logo.png", "/logo-dark.png", "/favicon/android-chrome-192x192.png", "/favicon/android-chrome-512x512.png"];
const NEVER = [/^\/api\//, /^\/auth\//, /^\/studio/, /^\/admin/, /^\/seller\//, /^\/seller$/, /^\/account/, /^\/checkout/, /^\/login/, /^\/register/, /^\/reset-pin/, /^\/forgot-password/];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // photos from other sites go straight to the network
  if (NEVER.some((r) => r.test(url.pathname))) return;       // private areas are never touched

  // page navigations: network first, offline page as the fallback
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }

  // built assets + icons: cache first (they are fingerprinted, so a new deploy gets new URLs)
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/favicon/") || url.pathname === "/logo.png" || url.pathname === "/logo-dark.png") {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
  }
});
