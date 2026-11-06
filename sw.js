/* sw.js — кеш клипа в браузере. Картинки, кадры анимаций и шрифты берутся из кеша (cache-first):
   их URL содержат ?v=CLIP.ver, поэтому после замены картинки и поднятия ver браузер скачает новую.
   Скрипты, страница и песня идут мимо (скрипты всегда свежие; песню кеширует сам браузер). */
const CACHE = 'gumdong-clip-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (!/\/assets\/(sprites|anim|fonts|bg)\//.test(url.pathname)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req); if (hit) return hit;
    const r = await fetch(req); if (r.ok) c.put(req, r.clone());
    // старые версии той же картинки (другой ?v=) удаляем, чтобы кеш не рос
    if (r.ok && url.search) c.keys().then(ks => ks.forEach(k => { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k); }));
    return r;
  }));
});
