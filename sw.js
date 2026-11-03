// KRESF v3: retire legacy root-scoped PWA cache; the installable app lives at /app/.
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith('kresf-')).map(name => caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.mode !== 'navigate' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).catch(() => new Response('KRESF companion website requires an internet connection. Reconnect and reload.',{headers:{'Content-Type':'text/plain; charset=utf-8'},status:503})));
});
