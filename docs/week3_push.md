# references

- [push notification tutorial](https://developers.google.com/web/fundamentals/codelabs/push-notifications?hl=ko)
- [push notification](https://developer.mozilla.org/ko/docs/Web/Progressive_web_apps/Re-engageable_Notifications_Push)
- [mdn serviceworker cookbook - push simple](https://github.com/mozilla/serviceworker-cookbook/)

# Push

- 푸시를 받을 Service Worker가 있어야 한다.
- Service Worker는 푸시 서버로부터 데이터를 받아서 데이터를 가공해 알림 시스템을 통해 메시지를 사용자에게 전송할 수 있다.

1. Service Worker에서 푸시 서버를 구독한다.

- 푸시 서버에서는 사용자가 구독했을 때 저장한 정보를 통해 사용자에게 메시지를 보낼 수 있다.

```jsx
registration.pushManager.getSubscription().then(/* ... */);
```

2. 암호화

- 서버사이드에서는 보안적인 이유로 전체 프로세스를 공개키와 비공개키를 사용하여 암호화해야 한다.

3. 푸시 수신

- 푸시 메시지를 수신하려면, Service Worker 파일에서 push이벤트를 사용한다.

```jsx
self.addEventListener("push", function (e) {
  /* ... */
});
```

---

### 푸시 서버 구독

1. 서비스 워커 등록 및 푸시 서버 구독

- register callback에서 `registration.pushManager.getSubscription()` 을 통해 푸시 서버를 구독한다.

```jsx
// register.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((registration) => {
        // run after register -> install -> activate
        console.log("Service Worker is registered", registration);

        **return registration.pushManager
          .getSubscription()
          .then(async function (subscription) {
						// registration part
          });**
      })
      .catch((err) => {
        console.error("Registration failed:", err);
      });
  });
}
```

2. subscription handle

- 사용자가 이미 구독했다면, `subscription`을 반환한다.
- 아니라면 새로운 `subscription`을 만든다

```jsx
return registration.pushManager
  .getSubscription()
  .then(async function (subscription) {
    if (subscription) {
      return subscription;
    }

    const response = await fetch("./vapidPublicKey");
    const vapidPublicKey = await response.text();
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

    return registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  });
```

3. `urlBase64ToUint8Array`

- Chrome 지원을 위해 Uint8Array로 변환한다.

```jsx
// tools.js
function urlBase64ToUint8Array(base64String) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// index.html
<script src="js/tools.js"></script>;
```

3. `registration.pushManager.subscribe()`를 return 하며 새로운 사용자를 구독한다.

- `userVisibleOnly: true` : 사용자에게 전송되는 모든 알림이 보여진다
- `applicationServerKey` : Uint8Array로 변환된 공개키를 전달한다.

```jsx
return registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: convertedVapidKey,
});
```

### push 요청

1. 아래 코드에 이어서 return 받은 subscription을 가지고 notification을 요청한다.

```jsx
.then((registration) => {
        // run after register -> install -> activate
        console.log("Service Worker is registered", registration);

        **return registration.pushManager
          .getSubscription()
          .then(async function (subscription) {
						// registration part
          });**
})
```

- register api에 subscription을 body에 담아 post 요청을 날리면, 서버에서 subscription을 받아서 정보를 저장한다.

```jsx
.then((subscription) => {
  fetch("./register", {
    method: "post",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({
      subscription: subscription,
    }),
  });
})
```

- 사용자가 message, delay, ttl(time to leave)을 입력한 뒤 push 버튼을 누르면 sendNotification api를 요청한다.

```jsx
.then((subscription) => {
  ...

  document.getElementById("pwa-push-button").onclick = function () {
    const payload = document.getElementById("pwa-push-payload").value;
    const delay = document.getElementById("pwa-push-delay").value;
    const ttl = document.getElementById("pwa-push-ttl").value;

    fetch("./sendNotification", {
      method: "post",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        subscription: subscription,
        payload: payload,
        delay: delay,
        ttl: ttl,
      }),
    });
  };
})
```

- index.html

```jsx
<div>
  <h3>push notification</h3>
  <div>
    <p>message</p>
    <input id="pwa-push-payload"></input>
  </div>
  <div>
    <p>delay</p>
    <input id="pwa-push-delay"></input>
  </div>
  <div>
    <p>time to leave</p>
    <input id="pwa-push-ttl"></input>
  </div>


</div>

<button id="pwa-push-button">
  push notification to me
</button>
```

### server

- koa를 이용한다.

1. 필요한 패키지 설치

- api를 요청받을 때, body를 파싱해야하므로 `koa-bodyparser` 설치
- 공개키와 비공개키를 받기 위해, notification을 보내기 위해 `web-push` 설치

```bash
yarn add koa-bodyparser web-push
```

- server.js
  - 처음 실행할 때 환경 변수에 `VAPID_PUBLIC_KEY` , `VAPID_PRIVATE_KEY` 키가 없으면 새로 발급해준다.
  - 발급받은 키는 환경변수에 저장한다.

```jsx
const bodyParser = require("koa-bodyparser");
const webPush = require("web-push");

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.log(
    "You must set the VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY " +
      "environment variables. You can use the following ones:"
  );
  console.log(webPush.generateVAPIDKeys());
  return;
}

webPush.setVapidDetails(
  "https://serviceworke.rs/",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

app.use(bodyParser());

app.use(async (ctx) => {
  ctx.body = ctx.request.body;
  await send(ctx, "build/index.html");
});
```

2. api 응답

- `vapidPublicKey`
  - `VAPID_PUBLIC_KEY` 로 응답한다.

```jsx
app.use(async (ctx) => {
  ctx.body = ctx.request.body;

  switch (ctx.req.url) {
    case "/vapidPublicKey":
      ctx.body = process.env.VAPID_PUBLIC_KEY;
      break;
    default:
      await send(ctx, "build/index.html");
  }
});
```

- `register`
  - subscription을 받아서 저장하는 로직을 작성한다. 이 예제에서는 하지 않는다.

```jsx
app.use(async (ctx) => {
  ctx.body = ctx.request.body;

  switch (ctx.req.url) {
		...
    case "/register":
      // TODO: store subscription information
      ctx.response.status = 201;
      break;
    default:
      await send(ctx, "build/index.html");
  }
});
```

- `sendNotification`
  - webPush를 통해 알림을 보낸다.

```jsx
app.use(async (ctx) => {
  ctx.body = ctx.request.body;

  switch (ctx.req.url) {
    ...
    case "/sendNotification":
      const subscription = ctx.request.body.subscription;
      const payload = ctx.request.body.payload;
      const options = {
        TTL: ctx.request.body.ttl,
      };

      setTimeout(function () {
        webPush
          .sendNotification(subscription, payload, options)
          .then(function () {
            ctx.body = 201;
          })
          .catch(function (error) {
            console.log(error);
            ctx.body = 500;
          });
      }, ctx.request.body.delay * 1000);
      break;
    default:
      await send(ctx, "build/index.html");
  }
});
```

### service-worker

- push 이벤트 리스너 추가
- 받은 notification을 사용자에게 보여준다.

```jsx
self.addEventListener("push", function (event) {
  const payload = event.data ? event.data.text() : "no payload";
  event.waitUntil(
    self.registration.showNotification("pwa study push", {
      body: payload,
    })
  );
});
```

이미지

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/d85de04f-6b6c-4b33-8e41-8bc6224c2f72/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/d85de04f-6b6c-4b33-8e41-8bc6224c2f72/Untitled.png)
