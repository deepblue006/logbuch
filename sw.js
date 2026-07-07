/* Logbuch des Kapitäns — Service Worker
   Strategie „Netz zuerst, Cache als Rettung“: online kommt stets die frische
   Fassung, offline läuft die zuletzt geladene. Kein Push, keine weitere Magie. */
'use strict';
const CACHE = 'logbuch-v1';
const KERN = ['./', './index.html', './icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(KERN)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(schluessel =>
    Promise.all(schluessel.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;   // Schriften u. Ä. regelt der Browser selbst
  e.respondWith(
    fetch(e.request)
      .then(antwort => {
        const kopie = antwort.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopie));
        return antwort;
      })
      .catch(() =>
        caches.match(e.request).then(treffer => treffer || caches.match('./index.html'))
      )
  );
});
