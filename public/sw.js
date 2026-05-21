const CACHE_NAME = 'daraja-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/daraja_icon.svg',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  // Stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Cache successful responses for our origin and common image domains
        const url = event.request.url;
        const isImageHost = url.includes('imgur.com') || url.includes('picsum.photos') || url.includes('unsplash.com');
        
        if ((networkResponse.ok || networkResponse.status === 0) && (url.startsWith(self.location.origin) || isImageHost)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return cached response if network fails, or a fallback
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PRECACHE_IMAGES') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      urls.forEach((url) => {
        cache.match(url).then(response => {
          if (!response) {
            fetch(url, { mode: 'no-cors' }).then(networkResponse => {
              if (networkResponse.ok || networkResponse.status === 0) {
                cache.put(url, networkResponse.clone());
              }
            }).catch(err => console.warn('Failed to precache:', url, err));
          }
        });
      });
    });
  }
});

