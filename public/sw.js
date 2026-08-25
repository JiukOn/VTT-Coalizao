/* sw.js — Service Worker for VTT Coalizão PWA */

const CACHE_NAME = 'vtt-coalizao-v1'
const STATIC_ASSETS = [
  './',
  './index.html',
  './player.html',
  './manifest.json',
  './favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching static assets failed:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Ignore non-GET, WebSocket and chrome-extension requests
  if (
    event.request.method !== 'GET' ||
    event.request.url.startsWith('ws') ||
    event.request.url.startsWith('chrome-extension')
  ) {
    return
  }

  // Network-first with Cache fallback strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for static assets
        if (response.status === 200 && response.type === 'basic') {
          const resClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone).catch(() => {})
          })
        }
        return response
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) return cachedResponse
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html')
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' })
      })
  )
})
