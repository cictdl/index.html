/* Service worker — திருக்குறள் 22 மொழிகள் · offline-first
   shell (html/js/css/manifest): network-first, so a deploy lands without a version bump,
     with the precached copy as the offline fallback;
   data / audio / fonts: cache-first — they are content-addressed or immutable per build;
   audio also gets Range support so <audio> can seek inside a cached file;
   plus the daily-kural notification. */
const VERSION = 'v3';
const SHELL = 'kural-shell-' + VERSION;
const RT = 'kural-rt-v1';
const PREFS = 'kural-prefs';
const SHELL_URLS = ['./', './index.html', './app.js', './styles.css', './assets/fonts.css', './manifest.webmanifest',
  './assets/cict-logo.png', './assets/icon-192.png', './assets/icon-512.png', './assets/favicon.png', './assets/apple-touch-icon.png',
  './data/meta.json', './data/glossary.json', './data/tags.json', './data/audio.json', './data/ch/001.json', './data/gr/001.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('kural-shell-') && k !== SHELL) await caches.delete(k);
    await self.clients.claim();
  })());
});

const isData = u => /\/(data|audio|assets)\//.test(u.pathname);
const isFont = u => /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
// The app shell — small, changes on every deploy, so always prefer the network.
const isShell = u => u.origin === location.origin && !isData(u) &&
  (/\.(html|js|css|webmanifest)$/.test(u.pathname) || u.pathname.endsWith('/'));

async function rangeResponse(req, full) {
  const buf = await full.arrayBuffer();
  const m = /bytes=(\d+)-(\d*)/.exec(req.headers.get('range') || '');
  const start = m ? +m[1] : 0; const end = m && m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  const slice = buf.slice(start, end + 1);
  return new Response(slice, { status: 206, statusText: 'Partial Content', headers: {
    'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`,
    'Content-Length': String(slice.byteLength), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || isShell(url)) {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) { const c = await caches.open(SHELL); c.put(req.mode === 'navigate' ? './index.html' : url.pathname, res.clone()); }
        return res;
      } catch {
        return (await caches.match(req.mode === 'navigate' ? './index.html' : url.pathname, { ignoreSearch: true }))
            || (await caches.match('./index.html'))
            || new Response('offline', { status: 503 });
      }
    })());
    return;
  }
  if (isData(url) || isFont(url) || url.origin === location.origin) {
    e.respondWith((async () => {
      const key = url.origin === location.origin ? url.pathname : req.url;
      const cached = (await caches.match(key, { ignoreSearch: true })) || (await caches.match(req, { ignoreSearch: true }));
      if (cached) {
        if (req.headers.has('range')) return rangeResponse(req, cached.clone());
        return cached;
      }
      try {
        if (req.headers.has('range')) {
          // fetch full object once, cache it, serve the requested slice
          const full = await fetch(url.href);
          if (full.ok && full.status === 200) { const c = await caches.open(RT); await c.put(key, full.clone()); return rangeResponse(req, full); }
          return full;
        }
        const res = await fetch(req);
        if (res.ok && (isData(url) || isFont(url))) { const c = await caches.open(RT); c.put(isFont(url) ? req : key, res.clone()); }
        return res;
      } catch (err) {
        return new Response(JSON.stringify({ error: 'offline', url: url.pathname }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
    })());
  }
});

// ───────── daily kural notification ─────────
const pad = (n, w) => String(n).padStart(w, '0');
function dailyN(d = new Date()) { const days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); return ((days * 1103) % 1330 + 1330) % 1330 + 1; }
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1, 2)}-${pad(d.getDate(), 2)}`; };
async function getPrefs() { try { const c = await caches.open(PREFS); const r = await c.match('/__prefs'); return r ? await r.json() : null; } catch { return null; } }
async function setPrefs(p) { const c = await caches.open(PREFS); await c.put('/__prefs', new Response(JSON.stringify(p), { headers: { 'Content-Type': 'application/json' } })); }
async function checkDaily(force) {
  const p = await getPrefs(); if (!p || (!p.notify && !force)) return;
  const key = todayKey(); if (!force && p.lastNotified === key) return;
  const [h, mi] = (p.time || '07:00').split(':').map(Number); const now = new Date();
  if (!force && now.getHours() * 60 + now.getMinutes() < h * 60 + mi) return;
  const n = dailyN(); const chN = Math.ceil(n / 10);
  let k, name = '';
  try {
    const r = (await caches.match(`./data/ch/${pad(chN, 3)}.json`, { ignoreSearch: true })) || await fetch(`./data/ch/${pad(chN, 3)}.json`);
    const ch = await r.json(); k = ch.kurals[(n - 1) % 10]; name = ch.name;
  } catch { return; }
  const f = (p.langs || []).find(c => c !== 'ta' && k.tr[c]);
  const body = `${k.l1}\n${k.l2}` + (f ? `\n${k.tr[f].filter(Boolean).join(' ')}` : '');
  await self.registration.showNotification(`இன்றைய குறள் ${n} · ${name}`, { body, icon: './assets/icon-192.png', badge: './assets/icon-192.png', tag: 'daily-kural', data: { n }, lang: 'ta' });
  p.lastNotified = key; await setPrefs(p);
}
self.addEventListener('periodicsync', e => { if (e.tag === 'daily-kural') e.waitUntil(checkDaily(false)); });
self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'check-daily') e.waitUntil(checkDaily(!!e.data.force));
  if (e.data.type === 'skip-waiting') self.skipWaiting();
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const n = (e.notification.data || {}).n; const hash = n ? `#/k/${n}` : '#/daily';
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if ('focus' in c) { await c.focus(); c.postMessage({ type: 'open', hash }); return; } }
    await self.clients.openWindow('./index.html' + hash);
  })());
});
