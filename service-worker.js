const filesToCache = ["/", "styles/index.css", "index.html"];

const staticCacheName = "pages-cache-v1";

// caching resources when installed
self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
  self.skipWaiting();

  console.log("Check Cache Storage in Application section");
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll(filesToCache);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
});

self.addEventListener("fetch", (event) => {
  console.log("Fetch event for ", event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("Found ", event.request.url, " in cache");
        return caches.open(staticCacheName).then((cache) => {
          cache.put(event.request.url, response.clone());
          return response;
        });
      }
      console.log("Network request for ", event.request.url);
      return fetch(event.request);
    })
  );
});
