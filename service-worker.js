const CACHE = '42brain-v11';
const CORE = [
  './', './index.html', './style.css', './premium.css', './game.js', './puzzles.js',
  './storage.js', './achievements.js', './sounds.js', './arcade.js',
  './product-enhancements.js', './js/arcade/catalog.js', './js/arcade/games.js',
  './manifest.webmanifest', './icon.svg', './ui-icons.svg', './creator-avatar.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('42brain-') && key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response && response.ok) caches.open(CACHE).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html').then(cached => cached || caches.match('./'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => {
    const network = fetch(request).then(response => {
      if (response && response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone()));
      return response;
    }).catch(error => {
      if (cached) return cached;
      throw error;
    });
    return cached || network;
  }));
});
