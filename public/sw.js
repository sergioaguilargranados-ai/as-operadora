// ═══════════════════════════════════════════════════════════════
// 🔧 AS OPERADORA — Service Worker v1.0
// ═══════════════════════════════════════════════════════════════
// Estrategia: Network-First para APIs, Cache-First para assets

const CACHE_NAME = 'as-operadora-v1'
const STATIC_CACHE = 'as-operadora-static-v1'
const API_CACHE = 'as-operadora-api-v1'

// Assets estáticos para pre-cachear
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.svg',
]

// Rutas de API que se pueden cachear (GET only)
const CACHEABLE_API_ROUTES = [
  '/api/tours',
  '/api/cities',
  '/api/featured-destinations',
  '/api/featured-packages',
  '/api/homepage',
]

// ═══ INSTALL ═══
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Pre-cacheando assets estáticos')
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Error pre-cacheando algunos assets:', err)
      })
    })
  )
  // Activar inmediatamente sin esperar
  self.skipWaiting()
})

// ═══ ACTIVATE ═══
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando cache antiguo:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Tomar control de todos los clientes
  self.clients.claim()
})

// ═══ FETCH ═══
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Solo manejar requests del mismo origen
  if (url.origin !== location.origin) return

  // Ignorar requests de autenticación y mutaciones
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/auth')) return
  if (url.pathname.startsWith('/api/cron')) return
  if (url.pathname.startsWith('/api/webhooks')) return

  // Estrategia para APIs cacheables: Network-First con fallback a cache
  if (url.pathname.startsWith('/api/') && CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE))
    return
  }

  // Estrategia para assets estáticos: Cache-First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE))
    return
  }

  // Para páginas HTML: Network-First con fallback a offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request))
    return
  }
})

// ═══ ESTRATEGIAS DE CACHE ═══

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('[SW] Sirviendo desde cache (offline):', request.url)
      return cachedResponse
    }
    throw error
  }
}

async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) return cachedResponse

  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    return new Response('Asset no disponible offline', { status: 503 })
  }
}

async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) return cachedResponse

    // Fallback a la página offline
    const offlinePage = await caches.match('/offline')
    if (offlinePage) return offlinePage

    return new Response(
      '<html><body><h1>Sin conexión</h1><p>No hay conexión a internet. Intenta de nuevo más tarde.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    )
  }
}

// ═══ HELPERS ═══

function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf']
  return staticExtensions.some(ext => pathname.endsWith(ext)) || pathname.startsWith('/_next/static/')
}

// ═══ PUSH NOTIFICATIONS ═══
self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const options = {
      body: data.body || 'Tienes una nueva notificación',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        dateOfArrival: Date.now(),
      },
      actions: data.actions || [
        { action: 'open', title: 'Ver' },
        { action: 'close', title: 'Cerrar' },
      ],
      tag: data.tag || 'as-operadora',
      renotify: true,
    }

    event.waitUntil(
      self.registration.showNotification(data.title || 'AS Operadora', options)
    )
  } catch (error) {
    console.error('[SW] Error procesando push:', error)
  }
})

// ═══ NOTIFICATION CLICK ═══
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'close') return

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Si no, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
