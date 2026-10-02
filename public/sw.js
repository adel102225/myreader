const APP_CACHE = 'myreader-app-v1';
const CONTENT_CACHE = 'myreader-content-v1';

const APP_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/library.js',
  '/search.js',
  '/genres.js',
  '/shortcuts.js',
  '/read.html',
  '/reader.html',
  '/reader.js',
  '/reader-extra.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key !== APP_CACHE &&
            key !== CONTENT_CACHE
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request);
    })
  );
});
