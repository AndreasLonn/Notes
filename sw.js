const cacheName = 'notes-v1';
const appShellFiles = [
    '/notes/',
    '/notes/index.html',
    '/notes/notes.css',
    '/notes/notes.js',
    '/notes/notes-icon.svg',
    '/notes/icons/icon-32.png',
    '/notes/icons/icon-64.png',
    '/notes/icons/icon-96.png',
    '/notes/icons/icon-128.png',
    '/notes/icons/icon-168.png',
    '/notes/icons/icon-192.png',
    '/notes/icons/icon-256.png',
    '/notes/icons/icon-512.png',
];
const contentToCache = appShellFiles;

self.addEventListener('install', (e) => {
    console.log('[Service Worker] Install');
    e.waitUntil((async() => {
        const cache = await caches.open(cacheName);
        console.log('[Service Worker] Caching');
        await cache.addAll(contentToCache);
    })());
});

self.addEventListener('fetch', (e) => {
    e.respondWith((async() => {
        const r = await caches.match(e.request);
        console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
        if (r) { return r; }
        const response = await fetch(e.request);
        const cache = await caches.open(cacheName);
        console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
        cache.put(e.request, response.clone());
        return response;
    })());
});

self.addEventListener('activate', (e) => {
    e.waitUntil(caches.keys().then((keyList) => {
        return Promise.all(keyList.map((key) => {
            if (key === cacheName) { return; }
            return caches.delete(key);
        }))
    }));
});