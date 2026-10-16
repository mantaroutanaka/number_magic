const CACHE = "number-magic-v5-learning-order";
const OFFLINE = ["./","./index.html","./game-v2.css","./game-v2.js","./manifest.webmanifest","./icons/icon.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(OFFLINE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("number-magic-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone()).catch(() => {});
      }
      return response;
    } catch(err) {
      const cached = await caches.match(event.request, {ignoreSearch:true});
      return cached || (event.request.mode==="navigate" ? caches.match("./index.html") : Response.error());
    }
  })());
});
