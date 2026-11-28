/* ManaBrand service worker — makes the site installable and keeps it usable on a bad connection.
 *  - Pages ALWAYS come from the network (logged-in pages must never be served stale from here);
 *    only when the network is dead does the friendly /offline page show.
 *  - Built JS / CSS / fonts, icons and the logo are cached so a repeat visit opens fast.
 *  - When a new VERSION ships, the old static cache is deleted — so the installed app never runs
 *    an old bundle that would send a login handshake the server no longer understands.
 *  - Nothing private is ever stored: no API calls, no sign-in, no admin / seller pages, no POSTs. */
const VERSION = "mana-v3";
const STATIC = `${VERSION}-static`;
const SHELL = ["/offline", "/logo.png", "/logo-dark.png", "/pwa/icon-192.png", "/pwa/icon-512.png"];
/** Paths the SW must never touch — anything with per-user content (and anything auth-related) stays between the browser and the server. */
const NEVER = [/^\/api\//, /^\/auth\//, /^\/studio/, /^\/admin/, /^\/seller\//, /^\/seller$/, /^\/account/, /^\/checkout/, /^\/cart/, /^\/login/, /^\/register/, /^\/reset-pin/, /^\/forgot-password/];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (e) => { if (e.data === "skip-waiting") self.skipWaiting(); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // photos from other sites go straight to the network
  if (NEVER.some((r) => r.test(url.pathname))) return;       // private areas are never touched
  // auth cookies arrive on page responses; never cache navigations — the fresh response (with the new Set-Cookie) must reach the browser
  if (req.headers.get("Accept")?.includes("text/html")) {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/offline")));
    return;
  }

  // built assets + icons: network-first in the background, cache as a fast fallback. If the page the browser is running
  // asks for an asset from a deploy that no longer exists, the SW fetches the new one — it never pins the old bundle.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/favicon/") || url.pathname.startsWith("/pwa/") || url.pathname === "/logo.png" || url.pathname === "/logo-dark.png") {
    e.respondWith(
      caches.match(req).then((hit) => {
        const live = fetch(req).then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(STATIC).then((c) => c.put(req, copy)); }
          return res;
        }).catch(() => hit);
        // serve the cached copy at once if we have one, and keep fetching to refresh it for next time
        return hit || live;
      }),
    );
  }
});
