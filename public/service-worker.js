const CACHE_NAME = 'tj-pro-trading-journal-v1';
const STATIC_CACHE_NAME = 'tj-pro-static-v1';

// Essential files to cache immediately
const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-192x192.png',
  '/icon-maskable-512x512.png',
  '/browserconfig.xml'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential files');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => {
        console.log('[SW] Essential files cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache essential files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - Cache First strategy with offline fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Cache First Strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // If not in cache, try network
        console.log('[SW] Fetching from network:', request.url);
        return fetch(request)
          .then((networkResponse) => {
            // Don't cache non-successful responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response before caching
            const responseToCache = networkResponse.clone();
            
            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('[SW] Caching new resource:', request.url);
                cache.put(request, responseToCache);
              });
            
            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Network failed, checking cache again:', request.url);
            
            // Network failed - try to serve index.html for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html')
                .then((indexResponse) => {
                  if (indexResponse) {
                    console.log('[SW] Serving index.html for navigation request');
                    return indexResponse;
                  }
                  // If even index.html is not cached, return a basic offline page
                  return new Response(
                    `<!DOCTYPE html>
                    <html>
                    <head>
                      <title>TradingJournal Pro - Offline</title>
                      <meta charset="UTF-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                      <style>
                        body { 
                          font-family: system-ui, -apple-system, sans-serif; 
                          background: #111827; 
                          color: white; 
                          display: flex; 
                          align-items: center; 
                          justify-content: center; 
                          min-height: 100vh; 
                          margin: 0; 
                          text-align: center;
                        }
                        .container { max-width: 400px; padding: 2rem; }
                        h1 { color: #3B82F6; margin-bottom: 1rem; }
                        button { 
                          background: #3B82F6; 
                          color: white; 
                          border: none; 
                          padding: 0.75rem 1.5rem; 
                          border-radius: 0.5rem; 
                          cursor: pointer; 
                          margin-top: 1rem;
                        }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <h1>TradingJournal Pro</h1>
                        <p>App is loading offline...</p>
                        <p>Please wait while we prepare your trading journal.</p>
                        <button onclick="window.location.reload()">Retry</button>
                      </div>
                    </body>
                    </html>`,
                    {
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform any background sync operations here
      console.log('[SW] Performing background sync...')
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  // Handle push notifications here if needed
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});