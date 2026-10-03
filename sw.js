// Book Sale Checkout offline cache.
// Change the version number whenever index.html is updated.
const CACHE = 'book-sale-v11';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  // fetch fresh copies, skipping the browser's own HTTP cache
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Serve from the cache right away; refresh the cache in the background when online.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const network = fetch(e.request).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
      return res;
    }).catch(async () => {
      if (cached) return cached;
      if (e.request.mode === 'navigate') return cache.match('./index.html');
      return Response.error();
    });
    return cached || network;
  }));
});
