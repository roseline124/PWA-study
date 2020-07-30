# PWA study

## What is PWA

### PWA

PWA is to make cross platform web application in modern browser using web API.
It can cover both web and app.

최신 웹 API을 사용하여 웹 표준을 지키는 브라우저가 있는 환경에서 크로스 플랫폼 웹 어플리케이션을 만드는 것

### Needed for PWA

- secure context (https): service worker is available in web site loaded using https
- service worker: precaching website resources(javascript, html, css, ..)
- manifest.json: it makes website installable

- 서비스워커는 https로 로드된 사이트에서만 사용할 수 있다.
- 서비스 워커: 웹사이트 resouces를 precaching한다.
- manifest.json: 웹사이트를 설치 가능하게 해준다.

## Service Worker

- https://developers.google.com/web/ilt/pwa/lab-scripting-the-service-worker
- https://developers.google.com/web/ilt/pwa/lab-caching-files-with-service-worker

### Service Worker

- 서비스워커는 프로그래밍 가능한 네트워크 프록시다.
  - page로부터 오는 network request를 어떻게 처리할 지 컨트롤 할 수 있다.
- 서비스워커는 HTTPS에서만 실행할 수 있다. 서비스워커가 network request를 가로채고, 응답을 수정하기 때문에 중간자 공격을 피하기 위해서이다.
  - 중간자 공격 (man-in-the-middle): 네트워크 통신을 조작하여 통신 내용을 도청하거나 조작하는 공격 기법
  - [https://letsencrypt.org/](https://letsencrypt.org/) 이런 서비스를 통해 SSL 인증서를 무료로 서버에 설치 가능
- 서비스워커는 프로그래밍 가능한 네트워크 프록시다.

### Service Worker의 동작

- 자바스크립트의 메인스레드와 분리되어 있다.
- network request가 오면 서비스워커가 가로챌 수 있고
- 응답을 캐시한 다음 캐싱한 resource를 서버에게 돌려주거나
- 푸시 메시지를 전달할 수 있다.
  - push message: 서버가 사용자 기기에 데이터를 보내는 것
  - notification: 사용자 기기의 네이티브 UI에 맞춰 데이터를 보내는 것
  - push message + notification = push notification 이라 한다.

### 특징

- 완전히 비동기적으로 동작하기 때문에 동기적으로 동작하는 XHR 을 blocking하지 않는다.
  - XHR: XMLHttpRequest은 웹 브라우저와 웹 서버 간에 메소드가 데이터를 전송하는 객체 폼의 API이다. 이 객체는 브라우저의 자바스크립트 환경에 의해 제공된다
- service worker에서는 LocalStroage 를 사용할 수 없다.
  - 자바스크립트의 메인 스레드는 동기적으로 동작하기 때문에 localStorage를 쓰면 자바스크립트 동작을 멈추게 할 수 있다.
  - indexDB를 쓰거나, 서비스워커를 통해 cache storage API를 사용해 저장한다.
  - [https://web.dev/storage-for-the-web/](https://web.dev/storage-for-the-web/)
- 서비스워커는 DOM에 직접적으로 접근할 수 없다.
  - 데이터를 보내기 위해서는 `window.postMessage()` 메서드를 써야하며
  - 데이터를 받기 위해서는 `message` event listener를 사용한다.

### Service Worker LifeCycle

**register**

- service worker를 설치하려면, 자바스크립트 코드에서 서비스워커를 등록해야한다.
- registration은 브라우저에게 서비스워커가 어디에 위치했는지 알려준다.
- 백그라운드에서 설치한다.
- 이미 설치가 되어있다면 navigator.serviceWorker.register는 현재 active 상태인 서비스워커 객체를 리턴한다.
- `scope` : 서비스워커가 어떤 파일들을 컨트롤할 지 정한다. 기본적으로 서비스워커가 위치한 곳 이하의 경로는 모두 scope에 들어간다. 예를 들어, 서비스워커 파일이 루트에 있으면 모든 파일이 scope에 들어간다.

in `index.html` script tag

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((registration) => {
        console.log("Service Worker is registered", registration);
      })
      .catch((err) => {
        console.error("Registration failed:", err);
      });
  });
}
```

**install**

- install event를 trigger한다. install 되는 동안 precaching을 할 수 있다.

**activate**

- 오직 하나의 서비스워커만 activate될 수 있다.
- 이전 서비스워커에 의해 컨트롤되는 페이지가 하나라도 열려있으면, 새로운 서비스워커는 `waiting` 상태에 들어간다. (새로고침한다고 해서 새로운 서비스워커로 넘어가는 건 아니다. 현재 페이지가 언마운트 되기 전에 새 페이지가 요청되므로 이전 서비스워커가 남아있는 상태기 때문이다. 따라서, 앱을 껐다 켜야만 새 서비스워커가 activate될 수 있다.)
- installing 안에서 `self.skipWaiting();`을 실행하면 새 서비스워커가 `waiting`을 스킵하고 바로 activate된다.
- activate 상태에서는 push, sync API만 사용할 수 있다.
  - fetch는 skipWaiting을 해야 쓸 수 있다.
  - `clients.claim()` 을 쓰면 바로 fetch할 수 있다.

in `service-worker.js`

```js
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
```

새로고침하기 전 개발자도구에서 service worker를 unregister한다.

### Service Worker Event

- 서비스워커는 event 위주로 돌아간다.
- install, activate, message, fetch, push, sync 등의 이벤트가 있다.
  - message: 서비스워커에서 javascript DOM과 커뮤니케이션할 때 사용
  - sync: 오프라인에서 왔던 요청을 모아뒀다가 온라인이 되서 싱크를 맞춰줄 때 사용

### Intercept network requests

서비스워커는 웹앱과 네트워크 사이에서 프록시 역할을 할 수 있다.

in `service-worker.js`

```js
self.addEventListener("fetch", (event) => {
  console.log("Fetching:", event.request.url);
});
```

### Cache data

서비스워커를 install할 때 precaching한 후, 네트워크 요청이 들어오면 요청을 가로채고 캐시로 응답한다.
사용하지 않는 캐시는 제거할 수 있다.

**precaching**

서비스워커가 비동기로 작동하는 것에 착안해서, 아래처럼 중요도가 높은 파일은 먼저 캐시하고 중요도가 낮은 파일은 그와 상관 없이 캐싱하는 전략을 쓸 수 있다.

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
      cache.addAll(filesToCache2); // 중요도가 낮은 파일

      return cache.addAll(filesToCache); // 중요도가 높은 파일을 우선적으로 캐싱
    })
  );
});
```

**serve files from cache**

custom response를 생성하고 싶을 땐, `event.respondWith()`를 사용한다.
코드를 수정한 후, 개발자도구로 오프라인 상태로 전환해서 확인한다.
캐시에서 resource를 가져와서 응답한다.

```js
self.addEventListener("fetch", (event) => {
  console.log("Fetch event for ", event.request.url);
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          console.log("Found ", event.request.url, " in cache");
          // TODO 5 - Respond with custom 404 page
          return caches.open(staticCacheName).then((cache) => {
            cache.put(event.request.url, response.clone());
            return response;
          });
        }
        console.log("Network request for ", event.request.url);
        return fetch(event.request);

        // TODO 4 - Add fetched files to the cache
      })
      .catch((error) => {
        // TODO 6 - Respond with custom offline page
      })
  );
});
```

## manifest.json file

- https://web.dev/add-manifest/

웹앱 manifest.webmanifest (또는 manifest.json) 파일은 브라우저에게 유저의 기기에 설치될 때 앱이 어떻게 동작해야 하는지에 대해 알려준다.
일반적으로 `app name`, `icon`, 앱이 실행될 때 열려야 할 페이지의 `url` 등이 들어간다.
앱을 설치 가능하게 만들려면 manifest 파일을 만들어야 한다.

```json
{
  "short_name": "PWA",
  "name": "PWA Study",
  "icons": [
    {
      "src": "/images/icons-192.png",
      "type": "image/png",
      "sizes": "192x192"
    }
  ],
  "start_url": "/maps/?source=pwa",
  "background_color": "#fff",
  "display": "standalone",
  "scope": "/",
  "theme_color": "#3740ff"
}
```

- \*short_name: 홈스크린, 런처 등에서 보여질 앱 이름. 쓰이는 곳이 제한적이다.
- \*name: 앱 설치 프롬프트에서 보여진다.
- icons: 실행할 때, 홈 스크린에서 보여질 때, 스플래시 화면에서 보여질 아이콘들
  - src: 이미지 경로
  - type: 파일 확장자
  - sizes: 이미지 사이즈
- start_url: 실행될 때 처음 시작하는 url
- backgroud_color: 스플래시 화면 배경색
- theme_color: 툴바 색깔
- display: 브라우저 ui를 정해서 보여줄 수 있다.
  - standalone: 네이티브 앱처럼 보이는 ui, 주소창 같이 브라우저처럼 보이는 ui 는 제외하고 보여줌
  - browser: 브라우저처럼 보이는 디스플레이
  - [그 외는 display 항목 참고](https://developers.google.com/web/fundamentals/web-app-manifest/)
- orientation: 방향
- scope: 브라우저가 내 앱에 있다고 여겨지는 url 집합들. scope에 정의된 url 외의 곳에 접근하면, 앱을 떠난 것으로 인식한다. scope를 통해서, entry, exit point를 컨트롤할 수 있다. start_url 역시 scope안에 있어야 한다.
  - 예시
  ```tsx
  "scope": "/maps/"
  "start_url": "/maps/?source=pwa"
  ```

**add to index.html**

```html
<link
  rel="manifest"
  href="/manifest.webmanifest"
  crossorigin="use-credentials"
/>
```

The request for the manifest is made without credentials (even if it's on the same domain), thus if the manifest requires credentials, you must include crossorigin="use-credentials" in the manifest tag.

manifest 요청은 같은 도메인이더라도 credential 없이 만들어진다. 그러므로 manifest 태그에 `crossorigin="use-credentials"`을 포함시켜야 한다.

**check**

Application 섹션의 manifest에서 확인할 수 있다.
manifest 파일이 안보인다면 시크릿 탭에서 확인해본다.

### Plus

- 캐시를 날릴 때는 새로운 워커가 activate된 상태에서 날려야 한다.

  - install 상태에서 캐시를 날리면 이미 있던 워커의 캐시가 날아가서 문제가 생기므로

- 사용자와 상호작용할 때

  - service-workert가 아니라, DOM에서 조작한다.
  - caches.open, caches.add
  - ex) 유튜브에서 `오프라인에 저장 버튼`을 누를 때

- `stale-while-revalidate`: 자주 업데이트 되는 데이터를 캐싱할 때 사용
  - 일단 캐시로 먼저 응답하고
  - 서버에 요청을 날려서, 데이터가 업데이트되었는지 확인한 후, 있다면 그것으로 업데이트한다.
