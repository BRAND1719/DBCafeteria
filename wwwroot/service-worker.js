/* PWA Cafetería: caché únicamente de recursos estáticos públicos. */
const CACHE_VERSION = 'cafeteria-pwa-static-v3';
const CACHE_PREFIX = 'cafeteria-pwa-static-';
const STATIC_FILES = [
  "offline.html",
  "css/estilos.css",
  "js/app.js",
  "js/crud.js",
  "js/excel.js",
  "js/dashboard.js",
  "js/login.js",
  "js/nuevo-pedido.js",
  "js/pedidos.js",
  "js/reportes.js",
  "manifest.webmanifest",
  "icons/apple-touch-icon.png",
  "icons/favicon-48.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png"
];
const absolute = path => new URL(path, self.registration.scope).href;
const STATIC_URLS = new Set(STATIC_FILES.map(absolute));
const OFFLINE_URL = absolute('offline.html');

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(Array.from(STATIC_URLS)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION)
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML se obtiene SIEMPRE del servidor. Sin conexión se muestra un aviso;
  // no se guarda información de usuarios, pedidos ni páginas autenticadas.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_VERSION);
        return (await cache.match(OFFLINE_URL)) || Response.error();
      })
    );
    return;
  }

  // /api/* y cualquier otra ruta dinámica no se interceptan ni almacenan.
  const staticUrl = new URL(url.href);
  staticUrl.search = '';
  staticUrl.hash = '';
  if (!STATIC_URLS.has(staticUrl.href)) return;

  // Network-first: actualizaciones visibles cuando hay conexión;
  // los recursos estáticos siguen disponibles si se pierde Internet.
  event.respondWith(
    fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.put(staticUrl.href, copy)));
      }
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE_VERSION);
      return (await cache.match(staticUrl.href)) || Response.error();
    })
  );
});
