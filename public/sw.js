/* VTP Coalizão — Service Worker (offline cache) */
const CACHE_NAME = 'vtp-coalizao-v1'
const PRECACHE = [
  '/Projeto-VTP/',
  '/Projeto-VTP/index.html',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  // Only cache same-origin GET requests
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // Cache successful responses for JS/CSS/fonts
        if (response.ok && (
          event.request.url.includes('/assets/') ||
          event.request.url.endsWith('.html')
        )) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => caches.match('/Projeto-VTP/index.html'))
    })
  )
})
