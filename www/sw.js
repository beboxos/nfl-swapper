// Service worker : jeu jouable hors-ligne une fois chargé. Incrémenter VERSION à chaque publication.
const VERSION = 'nfl-swapper-v2';
const TEAMS = ['ari', 'atl', 'bal', 'buf', 'car', 'chi', 'cin', 'cle', 'dal', 'den', 'det', 'gb', 'hou', 'ind', 'jax', 'kc',
  'lv', 'lac', 'lar', 'mia', 'min', 'ne', 'no', 'nyg', 'nyj', 'phi', 'pit', 'sf', 'sea', 'tb', 'ten', 'was'];
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/data.js', 'js/storage.js', 'js/assets.js', 'js/audio.js', 'js/fx.js', 'js/grid.js',
  'js/matcher.js', 'js/renderer.js', 'js/game.js', 'js/ui.js', 'js/main.js',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  ...TEAMS.map(t => `assets/logos/${t}.png`),
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord (mises à jour immédiates), cache en secours hors-ligne.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
