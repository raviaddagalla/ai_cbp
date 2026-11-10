// sw.js — Service Worker for SignBridge PWA
// Caches the app shell and sign dictionary for offline use.
// Uses a "cache-first" strategy for static assets and a "network-first"
// strategy for the API backend.

const CACHE_NAME  = "signbridge-v1";
const API_ORIGINS = ["http://localhost:8000"];

// Core app-shell files to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
];

// ── Install: pre-cache app shell ──
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

// ── Fetch: handle requests ──
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // API calls → network-first (fall back to nothing — backend must be online)
  if (API_ORIGINS.some((origin) => request.url.startsWith(origin))) {
    event.respondWith(fetch(request).catch(() => new Response("", { status: 503 })));
    return;
  }

  // Everything else → cache-first with network fallback
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((networkResponse) => {
          // Cache successful responses for future offline use
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse.clone()));
          }
          return networkResponse;
        })
    )
  );
});

