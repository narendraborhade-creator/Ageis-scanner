// Aegis 3D Safe Browser - Core Service Worker
// Version: 1.2.0 (v3 Cache)
// Caches essential static assets and the core browser shell for offline execution

const SHELL_CACHE_NAME = 'aegis-shell-v3';
const STATIC_CACHE_NAME = 'aegis-static-v3';
const FONT_CACHE_NAME = 'aegis-fonts-v3';

const CORE_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
];

// Install Event: Pre-cache core browser shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE_NAME).then((cache) => {
      console.log('[Aegis Service Worker] Pre-caching core browser shell assets');
      return cache.addAll(CORE_SHELL_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== SHELL_CACHE_NAME &&
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== FONT_CACHE_NAME
          ) {
            console.log('[Aegis Service Worker] Removing obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: Intelligent routing and caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // CRITICAL: NEVER intercept /api/ requests, proxy URLs, or iframe requests!
  // Always let the network handle /api/, proxy calls, and all iframe content directly!
  if (
    url.pathname.startsWith('/api/') ||
    request.url.includes('/api/proxy') ||
    url.searchParams.has('url') ||
    request.destination === 'iframe' ||
    request.headers.get('sec-fetch-dest') === 'iframe' ||
    request.headers.get('sec-fetch-mode') === 'nested-navigate'
  ) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 1. Navigation requests (HTML document / Core App Shell): Network-first with Cache fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    // If request is from an iframe, do not hijack it
    if (request.destination === 'iframe' || request.headers.get('sec-fetch-dest') === 'iframe') {
      return;
    }

    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(SHELL_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          console.log('[Aegis Service Worker] Offline detected: serving core shell from cache');
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to cached index.html only for top-level navigation
          return (await caches.match('/index.html')) || (await caches.match('/'));
        })
    );
    return;
  }

  // 2. Google Fonts & Web Fonts: Cache-first
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(FONT_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. Static Assets (Scripts, Styles, Images, SVGs): Stale-While-Revalidate
  const isStaticAsset =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              return cachedResponse;
            });

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Default: Network with Cache fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(request).then((networkResponse) => {
          return networkResponse;
        })
      );
    })
  );
});
