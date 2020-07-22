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

### Service Worker

- 서비스워커는 프로그래밍 가능한 네트워크 프록시다.
  - page로부터 오는 network request를 어떻게 처리할 지 컨트롤 할 수 있다.
- 서비스워커는 HTTPS에서만 실행할 수 있다. 서비스워커가 network request를 가로채고, 응답을 수정하기 때문에 중간자 공격을 피하기 위해서이다.
  - 중간자 공격 (man-in-the-middle): 네트워크 통신을 조작하여 통신 내용을 도청하거나 조작하는 공격 기법
  - [https://letsencrypt.org/](https://letsencrypt.org/) 이런 서비스를 통해 SSL 인증서를 무료로 서버에 설치 가능
- 서비스워커는 프로그래밍 가능한 네트워크 프록시다.
- page로부터 오는 network request를 어떻게 처리할 지 컨트롤 할 수 있다.
- 서비스워커는 HTTPS에서만 실행할 수 있다. 서비스워커가 network request를 가로채고, 응답을 수정하기 때문에 중간자 공격을 피하기 위해서이다.
  - 중간자 공격 (man-in-the-middle): 네트워크 통신을 조작하여 통신 내용을 도청하거나 조작하는 공격 기법
  - [https://letsencrypt.org/](https://letsencrypt.org/) 이런 서비스를 통해 SSL 인증서를 무료로 서버에 설치 가능

### Service Worker의 동작

- 자바스크립트의 메인스레드와 분리되어 있다.
- network request가 오면 서비스워커가 가로챌 수 있고
- 응답을 캐시한 다음 캐싱한 resource를 서버에게 돌려주거나
- 푸시 메시지를 전달할 수 있다.

### 특징

- 완전히 비동기적으로 동작하기 때문에 동기적으로 동작하는 XHR 을 blocking하지 않는다.
  - XHR: XMLHttpRequest은 웹 브라우저와 웹 서버 간에 메소드가 데이터를 전송하는 객체 폼의 API이다. 이 객체는 브라우저의 자바스크립트 환경에 의해 제공된다
- service worker에서는 LocalStroage 를 사용할 수 없다. → 왜?
- 서비스워커는 DOM에 직접적으로 접근할 수 없다.
  - 데이터를 보내기 위해서는 `window.postMessage()` 메서드를 써야하며
  - 데이터를 받기 위해서는 `message` event listener를 사용한다.

### Service Worker LifeCycle

**register**

- service worker를 설치하려면, 자바스크립트 코드에서 서비스워커를 등록해야함
- registration은 브라우저에게 서비스워커가 어디에 위치했는지 알려줌
- 백그라운드에서 설치하기 시작한다.
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

- 서비스워커는 event driven하다
- install, activate, message, fetch, push, sync 등의 이벤트가 있다.
