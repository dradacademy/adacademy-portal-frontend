// Service worker for the PWA/TWA build.
//
// Design goals, in priority order:
// 1. NEVER cache anything that could go stale in a way that breaks an exam
//    (the exam list, exam questions, submission state, auth). So every
//    request to the backend API (any absolute cross-origin URL, or a path
//    starting with /api/ or /portal/) is passed straight through to the
//    network with no caching at all — this service worker never touches
//    API traffic.
// 2. For the HTML document itself (the page you land on), use
//    "network-first, falling back to cache": always try the network first
//    so a student gets the latest deployed version the moment they're
//    online, and only serve the last-cached copy if the network request
//    fails (offline, or a flaky connection) — never serve a stale page
//    just because it's faster.
// 3. For the app's static assets (JS/CSS bundles, images, fonts) — the
//    stuff that makes the site FEEL fast or slow on every open — use
//    "stale-while-revalidate": answer immediately from cache if a cached
//    copy exists (no network round-trip in the way of first paint), while
//    a fresh copy is fetched in the background and saved for next time.
//    These files are content-hashed by the build (their filename changes
//    whenever their content does), so serving a cached one is never stale
//    in a way that matters — the browser simply asks for a new filename
//    once a new build ships, and that request naturally goes to the
//    network since nothing is cached under that new name yet.
// 4. Bump CACHE_VERSION whenever this file's caching *behavior* changes;
//    the old cache is deleted on activate so nothing lingers indefinitely.
const CACHE_VERSION = "adacademy-shell-v2";

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

// The HTML document (navigation requests) — network-first, cache fallback.
const handleDocumentRequest = async (request) => {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // No network and nothing cached — let the browser show its normal
    // offline error rather than us inventing a fake response.
    throw err;
  }
};

// Static assets (JS/CSS/images/fonts) — stale-while-revalidate: answer from
// cache instantly if we have it, refresh the cache in the background.
const handleAssetRequest = async (request) => {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cached) {
    // Kick off the background refresh but don't make the viewer wait on it.
    networkFetch;
    return cached;
  }

  // Nothing cached yet — this request has to wait on the network once.
  const networkResponse = await networkFetch;
  if (networkResponse) return networkResponse;
  // Truly offline with nothing cached — let the browser show its normal
  // network-error handling for this resource.
  throw new Error("No cached copy and network request failed");
};

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

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(handleDocumentRequest(request));
    return;
  }

  event.respondWith(handleAssetRequest(request));
});
