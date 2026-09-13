const CACHE = '42brain-v10';
const ASSETS = ['./', './index.html', './style.css', './game.js', './puzzles.js', './storage.js', './achievements.js', './sounds.js', './arcade.js', './js/arcade/catalog.js', './js/arcade/games.js', './manifest.webmanifest', './icon.svg', './ui-icons.svg', './creator-avatar.png'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
