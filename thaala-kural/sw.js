/* Service worker — தாளக் குறள் · offline-first
   shell (html/js/css/manifest): network-first, so a deploy lands without a version bump,
     with the precached copy as the offline fallback;
   data / sfx / fonts / icons: cache-first — immutable per build.
   Everything is precached at install (~3 MB), so the whole game works offline after one visit. */
const VERSION = 'v2';   // bump whenever data/ changes: chapter files are cache-first
const SHELL = 'tk-shell-' + VERSION;
const RT = 'tk-rt-' + VERSION;
const pad3 = n => String(n).padStart(3, '0');
const SHELL_URLS = ['./', './index.html', './app.js', './game.js', './audio.js', './lesson.js', './styles.css', './manifest.webmanifest',
  './assets/fonts.css', './assets/cict-logo.png', './assets/icon-192.png', './assets/icon-512.png', './assets/favicon.png'];
const CONTENT_URLS = [
  './assets/fonts/NotoSansTamil-ieVp2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-048cFpwEFI.woff2',
  './assets/fonts/NotoSansTamil-ieVp2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-048dlpwEFI.woff2',
  './assets/fonts/NotoSansTamil-ieVp2YdFI3GCY6SyQy1KfStzYKZgzN1z4LKDbeZce-048ddpwA.woff2',
  './assets/sfx/ta.wav', './assets/sfx/taka.wav', './assets/sfx/tick.wav', './assets/sfx/tick1.wav',
  './assets/sfx/good.wav', './assets/sfx/miss.wav', './assets/sfx/star.wav',
  './data/meta.json',
  ...Array.from({ length: 133 }, (_, i) => `./data/ch/${pad3(i + 1)}.json`)];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await c.addAll(SHELL_URLS);                       // the shell is all-or-nothing
    const rt = await caches.open(RT);
    await Promise.all(CONTENT_URLS.map(async u => {   // content is best-effort; the fetch handler fills gaps later
      try { const r = await fetch(u); if (r.ok) await rt.put(u, r); } catch (err) { /* offline at install: fill later */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if ((k.startsWith('tk-shell-') || k.startsWith('tk-rt-')) && k !== SHELL && k !== RT) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isContent = u => /\/(data|assets)\//.test(u.pathname);
const isShell = u => u.origin === location.origin && !isContent(u) &&
  (/\.(html|js|css|webmanifest)$/.test(u.pathname) || u.pathname.endsWith('/'));

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate' || isShell(url)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) { const c = await caches.open(SHELL); c.put(req.mode === 'navigate' ? './index.html' : url.pathname, res.clone()); }
        return res;
      } catch (err) {
        return (await caches.match(req.mode === 'navigate' ? './index.html' : url.pathname, { ignoreSearch: true }))
            || (await caches.match('./index.html'))
            || new Response('offline', { status: 503 });
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const cached = await caches.match(url.pathname, { ignoreSearch: true }) || await caches.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok && isContent(url)) { const c = await caches.open(RT); c.put(url.pathname, res.clone()); }
      return res;
    } catch (err) {
      return new Response(JSON.stringify({ error: 'offline', url: url.pathname }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
  })());
});

self.addEventListener('message', e => { if (e.data && e.data.type === 'skip-waiting') self.skipWaiting(); });
