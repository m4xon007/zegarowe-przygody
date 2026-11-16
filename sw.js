/* Zegarowe przygody 4.3 — offline shell dla GitHub Pages.
 * Aktualna strona pobierana jest z sieci przy każdym otwarciu; offline działa kopia.
 * Wyniki pozostają w localStorage i NIE są usuwane przez aktualizacje cache.
 */
const CACHE_NAME = 'zegarowe-przygody-shell-v4.3.0';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];
const SHELL_URL = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(name => name.startsWith('zegarowe-przygody-shell-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  // Network-first: nowa wersja HTML pojawi się po ponownym uruchomieniu online.
  // Podczas braku sieci wykorzystujemy ostatnią działającą wersję strony.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(SHELL_URL, response.clone());
        }
        return response;
      } catch (_error) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(SHELL_URL)) || (await cache.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Pliki ikony/manifestu też są dostępne offline. Online zawsze sprawdzamy nową wersję.
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    } catch (_error) {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(request)) || Response.error();
    }
  })());
});
