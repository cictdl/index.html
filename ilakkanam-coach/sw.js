/* Ilakkanam Coach service worker.
   Shell (.html/.js/.css/manifest + navigations): NETWORK-FIRST with cached fallback
   (lesson from kural-app: precached shell silently serves stale code).
   data/ and assets/: cache-first (immutable per data version). */
'use strict';
const VERSION = 'ic-v1';
const SHELL = ['./', 'index.html', 'app.js', 'styles.css', 'manifest.webmanifest', 'assets/icon.svg'];
const DATA_CACHE = VERSION + '-data';
const SHELL_CACHE = VERSION + '-shell';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL_CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== SHELL_CACHE && k !== DATA_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  const isData = url.pathname.includes('/data/') || url.pathname.includes('/assets/');
  if (isData) {
    // cache-first
    e.respondWith(
      caches.open(DATA_CACHE).then(c =>
        c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
          if (r.ok) c.put(e.request, r.clone());
          return r;
        }))
      )
    );
  } else {
    // network-first shell
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) caches.open(SHELL_CACHE).then(c => c.put(e.request, r.clone()));
        return r;
      }).catch(() =>
        caches.match(e.request).then(hit => hit || caches.match('index.html'))
      )
    );
  }
});
