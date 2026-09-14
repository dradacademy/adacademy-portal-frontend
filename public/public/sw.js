// Minimal, deliberately conservative service worker for the PWA/TWA build.
//
// Design goals, in priority order:
// 1. NEVER cache anything that could go stale in a way that breaks an exam
//    (the exam list, exam questions, submission state, auth). So every
//    request to the backend API (any absolute cross-origin URL, or a path
//    starting with /api/) is passed straight through to the network with
//    no caching at all — this service worker never touches API traffic.
// 2. For the app shell itself (the HTML page and its JS/CSS/image assets),
//    use "network-first, falling back to cache": always try the network
//    first so a student gets the latest deployed version the moment
//    they're online, and only serve the last-cached copy if the network
//    request fails (offline, or a flaky connection) — never serve a stale
//    bundle just because it's faster, since a stale bundle could run old
//    grading/timer logic against a live exam.
// 3. Bump CACHE_VERSION whenever this file changes; the old cache is
//    deleted on activate so nothing lingers indefinitely.
const CACHE_VERSION = "adacademy-shell-v1";

self.addEventListener("install", (event) => {
  // Activate the new service worker as soon as it's installed, instead of
  // waiting for every open tab to close — important for a site people may
  // keep open in a background tab for a long time.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_VERSION)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

const isApiRequest = (url) =>
  url.pathname.startsWith("/api/") || url.pathname.startsWith("/portal/");

self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Only ever handle simple GET requests — never intercept POST/PUT/PATCH/
  // DELETE (exam submissions, logins, admin edits, etc. must always go
  // straight to the network, unmodified).
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin (the backend API lives on a different domain) or any
  // same-origin /api//portal/ path — always network, never cached.
  if (url.origin !== self.location.origin || isApiRequest(url)) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        // Only cache successful, basic (same-origin) responses.
        if (networkResponse && networkResponse.ok) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) return cached;
        // No network and nothing cached — let the browser show its
        // normal offline error rather than us inventing a fake response.
        throw err;
      }
    })()
  );
});
