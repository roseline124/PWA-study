# references

- [push notification tutorial](https://developers.google.com/web/fundamentals/codelabs/push-notifications?hl=ko)
- [push notification](https://developer.mozilla.org/ko/docs/Web/Progressive_web_apps/Re-engageable_Notifications_Push)
- [notification](https://developer.mozilla.org/ko/docs/WebAPI/Using_Web_Notifications)
- [notification example repository](https://github.com/girliemac/html5-notifications-webOS-style/blob/master/js/notification.js)
- [notification이 브라우저에 안 뜰 때](https://stackoverflow.com/questions/53011652/desktop-notification-not-appearing-in-chrome)

# 알림 (Notifications)

- 알림 권한 허용 요청이 바로 뜨는 것은 안 좋고, 버튼을 누른다든지 어떤 페이지를 간다든지 이벤트가 발생했을 때 요청하는 것이 좋다. (과거 푸시 알림 악용 사례 때문에, 브라우저에서는 상호작용이 일어났을 때만 알림을 발생시키도록 한다.)
- Notifications API는 운영체제의 알림 기능을 사용한다. 사용자가 웹 앱을 보고있지않더라도 알림을 보여줄 수 있다.

```jsx
// index.html
const handleNotify = (e) => {
  // 브라우저가 알림을 지원하는지 확인
  if (!("Notification" in window)) {
    console.log("이 브라우저는 알림을 지원하지 않습니다.");
  } else {
    // promise 지원이 되는 경우
    if (checkNotificationPromise()) {
      Notification.requestPermission().then((permission) => {
        handlePermission(permission);
        if (permission === "granted") {
          Notify();
        }
      });
      // promise 지원이 안되는 경우
    } else {
      Notification.requestPermission(function (permission) {
        handlePermission(permission);
        if (permission === "granted") {
          Notify();
        }
      });
    }
  }
};
```

- `checkNotificationPromise` 를 사용해 브라우저에서 promise 지원이 되는지 확인한다.
  - `Notification.requestPermission().then()` 을 사용해 에러가 나면 promise 지원이 안되는 것

```jsx
function checkNotificationPromise() {
  try {
    Notification.requestPermission().then();
  } catch (e) {
    return false;
  }

  return true;
}
```

- 사용자가 알림 요청을 아직 안받았거나 거절했다면, 알림 버튼을 보여주고, 허용한 경우는 계속 보여줄 필요가 없으니 `display: none`으로 안보이게 한다.

```jsx
function handlePermission(permission) {
  const notificationBtn = window?.document?.querySelector(
    "#pwa-notification-button"
  );

  // 사용자의 응답에 관계 없이 크롬이 정보를 저장할 수 있도록 함
  if (!("permission" in Notification)) {
    Notification.permission = permission;
  }

  // 사용자 응답에 따라 단추를 보이거나 숨기도록 설정
  if (
    Notification.permission === "denied" ||
    Notification.permission === "default"
  ) {
    notificationBtn.style.display = "block";
  } else {
    notificationBtn.style.display = "none";
  }
}
```

- notification이 사용자에게 나타났을 때, `notification.close.bind(notification)` 을 통해 4초 뒤에 알림을 종료시킨다.

```jsx
function Notify() {
  const notifyBody = "Hello, Buddy :)";
  const notifyImg = "images/icons-192.png";
  const notification = new Notification("Welcome!", {
    body: notifyBody,
    icon: notifyImg,
  });

  notification.onshow(() =>
    setTimeout(notification.close.bind(notification), 4000)
  );
}
```

<details>

<summary>알림 이미지</summary>

![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/46149154-f263-488a-89c3-1e9d00f3f96b/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/46149154-f263-488a-89c3-1e9d00f3f96b/Untitled.png)

![notion://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F80323aa0-a1c1-4299-a8fc-1db8e89d99ff%2FUntitled.png?table=block&id=98db92b3-c004-4ffa-95fa-4795424ca341&width=3360&cache=v2](notion://www.notion.so/image/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fsecure.notion-static.com%2F80323aa0-a1c1-4299-a8fc-1db8e89d99ff%2FUntitled.png?table=block&id=98db92b3-c004-4ffa-95fa-4795424ca341&width=3360&cache=v2)

</details>

🧚‍♀️ [notification이 browser에 안 뜰 때](https://stackoverflow.com/questions/53011652/desktop-notification-not-appearing-in-chrome)

- chrome://flags/ 접속
- Enable native notifications 을 disable한다. (브라우저는 네이티브 알림을 사용하고 싶어하기 때문에)
