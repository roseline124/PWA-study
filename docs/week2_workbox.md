# WorkBox

### workbox로 할 수 있는 것

- 기존 서비스워커에서 구현하던 것을 워크박스에서 API로 편리하게 사용
  - Precaching
  - Runtime caching
  - Strategies
  - Request routing
  - Background sync
  - Helpful debugging
  - Greater flexibility and feature set than sw-precache and sw-toolbox

### before & after

1. workbox를 쓰기 전 service-worker.js

install, activate, fetch를 수동으로 구현해줘야 한다.

```js
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
```

2. workbox를 쓰는 servie-worker.js

```js
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
);

workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);
```

### import && precache

1. cdn으로 workbox import

웹팩으로 번들링할 필요가 없어 가장 간편하게 import할 수 있다.

`workbox-sw.js`

```js
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
);

if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}
```

- precache할 파일을 service worker에 수동으로 넣어준다. 혹은 cli를 사용해 자동으로 넣어줄 수 있다.

`service-worker.js`

```js
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js"
);

workbox.precaching.precacheAndRoute([
  { revision: "ec9d65fe244592436f87789dccaff04d", url: "index.html" },
  { revision: "0cc91afb4a73e228f35b50f7a912909e", url: "test.html" },
]);
```

2. work-box cli 사용

- `npm i -g workbox-cli`
- `workbox-wizard --injestManifest`
- build에 필요한 패키지 설치

```
yarn add -D workbox-cli

yarn build
yarn start
```

- package.json scripts 추가

```json
"copy": "copyfiles -u 1 src/**/**/* src/**/* src/* build",
"build": "npm run copy && workbox injectManifest workbox-config.js"
```

- `webpack-config.js` 추가

`globPatterns` 을 수정하면, 캐싱할 파일들을 업데이트할 수 있다.
`workbox injectManifest` 커맨드 실행하면, 바뀐 workbox-config.js을 업데이트 가능

```js
module.exports = {
  globDirectory: "build/",
  globPatterns: ["**/*.{html, js, json}"],
  swDest: "build/service-worker.js",
  swSrc: "src/service-worker.js",
};
```

- src/service-worker.js에 추가

```js
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);
```

`yarn build`를 실행하면 `self.__WB_MANIFEST`자리에 precache된 리소스들이 배열로 만들어진다.

- build/service-worker.js

```js
precacheAndRoute([
  { revision: "ec9d65fe244592436f87789dccaff04d", url: "index.html" },
  { revision: "0cc91afb4a73e228f35b50f7a912909e", url: "test.html" },
]);
```

revision은 workbox가 자동으로 만들어준 값이다.
이 값을 업데이트하지 않으면, 다른 말로 하면 `workbox injectManifest workbox-config.js`를 다시 실행해
서비스워커를 업데이트하지 않으면 캐시 업데이트가 되지 않는다.

- bundling
  - 빌드된 service-worker가 쓰는 es6 문법은 브라우저에서 알아들을 수 없으므로 따로 번들링해줘야 한다.
  - rollup, webpack 등 사용
- build만 하면 자동으로 캐시파일들을 생성해준다는 장점이 있다.

### 캐싱 전략

1. network-first

서버에 요청한 데이터를 먼저 쓰고, 동시에 데이터를 캐싱한다. 캐싱한 데이터는 네트워크 요청이 실패한 경우에 서브한다.

예시

```js
// service-worker.js

const articleHandler = workbox.strategies.networkFirst({
  cacheName: "articles-cache",
  plugins: [
    new workbox.expiration.Plugin({
      maxEntries: 50,
    }),
  ],
});

workbox.routing.registerRoute(/(.*)article(.*)\.html/, (args) => {
  return articleHandler.handle(args);
});
```

2. cache-first

캐시를 먼저 쓴다. 없으면 서버에 요청해서 데이터를 서브한다.

예시

```js
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { registerRoute } from "workbox-routing";

registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({
    cacheName: "images",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);
```

3. stale-while-revalidate

비동기적으로 캐시를 먼저 쓰고, 그동안 최신 데이터가 있는지 찾아본다.
자주 업데이트되지만 최신 데이터를 쓰지 않아도 되는 데이터에 사용되는 전략이다. ex) 아바타

예시

```js
import { ExpirationPlugin } from "workbox-expiration";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate } from "workbox-strategies";

// Cache Google Fonts with a stale-while-revalidate strategy, with
// a maximum number of entries.
registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new StaleWhileRevalidate({
    cacheName: "google-fonts",
    plugins: [new ExpirationPlugin({ maxEntries: 20 })],
  })
);
```

### plus

- `workbox.config({ debug: true })` : debug 모드. service-worker.js에 추가하면 workbox 로그를 볼 수 있다.
- 캐시파일은 특성 별로 따로 모아두는 게 편리하다. 캐시 별로 invalidate할 수 있기 때문이다.
  - ex) css는 css끼리, html은 html끼리.
