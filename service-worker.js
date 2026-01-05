/**
 * HOUSEZEN - SERVICE WORKER
 * Para funcionalidad offline y PWA
 */

const CACHE_NAME = 'housezen-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/login.css',
  '/styles/role-selector.css',
  '/styles/tenant.css',
  '/styles/landlord.css',
  '/js/core/config.js',
  '/js/core/auth.js',
  '/js/core/router.js',
  '/js/core/app.js',
  '/js/shared/ui.js',
  '/js/shared/utils.js',
  '/js/shared/profile.js',
  '/manifest.json'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Archivos en caché');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') {
    return;
  }

  // No cachear peticiones a Supabase
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en caché, devolver la respuesta cacheada
        if (response) {
          return response;
        }

        // Si no, hacer fetch y cachear la respuesta
        return fetch(event.request).then((response) => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Si falla todo, devolver página offline (opcional)
        return caches.match('/index.html');
      })
  );
});
