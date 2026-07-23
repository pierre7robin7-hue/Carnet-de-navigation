// Cache de l'app pour l'installation sur iPhone (accès instantané + usage
// possible sans réseau, utile en mer). Stratégie "réseau d'abord" : si une
// connexion est disponible, on récupère toujours la dernière version et on
// met à jour le cache ; hors-ligne, on sert la dernière version connue.
const CACHE_NAME = 'carnet-nav-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/00-ports.jsx',
  './src/00a-supabase.jsx',
  './src/01-utils.jsx',
  './src/02-store.jsx',
  './src/03-icons.jsx',
  './src/04-components.jsx',
  './src/04b-page-login.jsx',
  './src/05-page-dashboard.jsx',
  './src/06-page-history.jsx',
  './src/07-page-detail.jsx',
  './src/08-page-form.jsx',
  './src/09-page-map.jsx',
  './src/09b-page-export.jsx',
  './src/10-app.jsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Les requêtes vers Supabase (ou toute autre origine) ne sont jamais mises
  // en cache : elles doivent échouer normalement hors-ligne, pour que l'app
  // sache qu'elle n'est pas synchronisée plutôt que de servir une réponse figée.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
  );
});
