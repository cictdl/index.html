/* Service worker — குறள் பாலம் · Kural Bridge, offline-first.
   shell: network first, the cached copy when offline, so a deploy lands on the next open;
   data and fonts: cache first, kept as they are fetched (the language a player chooses, the
   chapters played) — bump VERSION when build/build_data.py is run again. */
const VERSION = 'v2';
const SHELL = 'kb-shell-' + VERSION;
const DATA = 'kb-data-' + VERSION;
const SHELL_URLS = ['./', './index.html', './app.js', './styles.css', './manifest.webmanifest', './assets/fonts.css',
  './assets/icon.svg', './assets/icon-192.png', './assets/icon-512.png', './assets/favicon-32.png',
  './data/meta.json', './data/scripts.json'];

self.addEventListener('install', e => {
  e.waitUntil((async () => { await (await caches.open(SHELL)).addAll(SHELL_URLS); await self.skipWaiting(); })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![SHELL, DATA].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  if (url.pathname.includes('/data/ch/') || url.pathname.includes('/data/tr/') || url.pathname.includes('/ui/') || url.pathname.includes('/assets/fonts/')) {
    e.respondWith(caches.open(DATA).then(async c => (await c.match(e.request)) || fetch(e.request).then(r => {
      if (r.ok) c.put(e.request, r.clone()); return r;
    })));
    return;
  }
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request, { cache: 'no-cache' });
      if (r.ok) (await caches.open(SHELL)).put(e.request, r.clone());
      return r;
    } catch (err) {
      const cached = await caches.match(e.request, { ignoreSearch: true });
      if (cached) return cached;
      if (e.request.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    }
  })());
});
