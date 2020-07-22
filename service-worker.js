// caching resources when installed
self.addEventListener("install", (event) => {
  console.log("Service worker installing...");
  // Add a call to skipWaiting here
  self.skipWaiting();
  console.log("Service worker skip waiting...");
});

self.addEventListener("activate", (event) => {
  console.log("Service worker activating...");
});
