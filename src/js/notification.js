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

function checkNotificationPromise() {
  try {
    Notification.requestPermission().then();
  } catch (e) {
    return false;
  }

  return true;
}

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

const handleNotify = (e) => {
  // 브라우저가 알림을 지원하는지 확인
  if (!("Notification" in window)) {
    console.log("이 브라우저는 알림을 지원하지 않습니다.");
  } else {
    if (checkNotificationPromise()) {
      Notification.requestPermission().then((permission) => {
        handlePermission(permission);
        if (permission === "granted") {
          Notify();
        }
      });
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
