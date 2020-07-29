# Install

### references

- [https://web.dev/install-criteria/](https://web.dev/install-criteria/) pwa 설치 기준
- [https://web.dev/promote-install/#browser-promotion](https://web.dev/promote-install/#browser-promotion) 브라우저 설치 프롬프트

### install

- 대부분의 브라우저는 특정 기준이 충족되면

  - 주소 바나 브라우저 하단에 설치 알림을 뜨게 할 수 있다.

    ![https://s3-us-west-2.amazonaws.com/secure.notion-static.com/14b55299-e719-4b8a-8d98-4c52732d04df/Untitled.png](https://s3-us-west-2.amazonaws.com/secure.notion-static.com/14b55299-e719-4b8a-8d98-4c52732d04df/Untitled.png)

  - `beforeinstallprompt` 이벤트를 발생시킨다.

### install criteria

- 크롬

  - 웹앱이 설치되지 않은 상태
  - 유저의 활동이 있어야 함(Meets a user engagement heuristic (이전에는 사용자가 최소 30 초 동안 도메인과 상호 작용해야했지만 더 이상 요구 사항이 아님))
  - https 도메인
  - manifest 파일에 아래 property들이 필요
    - `short_name` or `name`
    - `icons` (192px, 512px은 필수)
      - [프로젝트에 쓰인 icon 출처](https://github.com/withspectrum/spectrum/issues/1106)
    - `start_url`
    - `display` : fullscreen, standalone, minimal-ui 중 하나여야 함
    - prefer_related_applications가 present가 아니거나 false여야 함 (true면 구글 플레이스토어로 이동시킴)
    - iOS는 meta태그를 사용해야한다. (2018년 중반에 개발시작) (또는 [pwacompat 사용](https://github.com/GoogleChromeLabs/pwacompat))
  - fetch 핸들러가 있는 서비스워커가 등록되어 있어야 함

- 다른 브라우저의 설치 기준
  - [Edge](https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps#requirements)
  - [Firefox](https://developer.mozilla.org/en-US/Apps/Progressive/Add_to_home_screen#How_do_you_make_an_app_A2HS-ready)
  - [Opera](https://dev.opera.com/articles/installable-web-apps/)
  - [Samsung Internet](https://hub.samsunginter.net/docs/ambient-badging/)
  - [UC Browser](https://plus.ucweb.com/docs/pwa/docs-en/zvrh56)

만약 안드로이드에서, manifest 파일에 `related_applications` 와 `prefer_related_applications: true` 가 포함되어 있으면, 네이티브앱 설치 창을 띄우는 대신에 유저를 구글 플레이 스토어로 이동시킨다.

### Browser promotion

- 안드로이드 크롬 브라우저에는 mini-infobar를 유저에게 보여주는데, `beforeinstallprompt` 이벤트가 발생할 때 `preventDefault()` 를 호출함으로써 mini-infobar가 못 뜨게 할 수 있다.
- 만약 `preventDefault()` 를 호출하지 않으면, 설치 기준을 충족한 첫 순간에 배너가 뜨고 90일 이후에나 다시 뜨게 할 수 있다.
- 설치 경험이 유저의 사이트 경험을 방해해서는 안되므로, 설치 버튼, 배너 등을 만들어 웹사이트에 보여주는 게 낫다.
- [여기](https://web.dev/promote-install/#browser-promotion)에 다양한 예시가 있다.

### `beforeinstallprompt` event

1. install 과정

- `beforeinstallprompt` 이벤트를 linstening 한다.
- 이벤트를 저장하고 있다가, 필요한 순간에 install flow를 trigger한다.

2. listen & save

```jsx
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  showInstallPromotion();
});
```

3. install flow

- `prompt()` 는 deferredEvent에서 한 번만 호출할 수 있다.
- 만약 유저가 설치를 거절하면, `beforeinstallprompt` 이벤트가 다시 발생할 때까지 기다려야 한다.

```jsx
buttonInstall.addEventListener("click", (e) => {
  // Hide the app provided install promotion
  hideMyInstallPromotion();
  // Show the install prompt
  deferredPrompt.prompt();
  // Wait for the user to respond to the prompt
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }
  });
});
```

4. `appinstalled` 이벤트

- PWA를 주소 바나, 다른 브라우저 컴포넌트에서 설치하게 하려는 경우 `appinstalled` 이벤트를 활용한다.

```jsx
self.addEventListener("appinstalled", (e) => {
  console.log("install success");
});
```

5. 실행됐는지 확인하기

- css

  ```css
  @media all and (display-mode: standalone) {
    body {
      background-color: yellow;
    }
  }
  ```

- js에서 확인

  ```jsx
  window.addEventListener("DOMContentLoaded", () => {
    let displayMode = "browser tab";
    // safari
    if (navigator.standalone) {
      displayMode = "standalone-ios";
    }
    if (window.matchMedia("(display-mode: standalone)").matches) {
      displayMode = "standalone";
    }
    console.log("DISPLAY_MODE_LAUNCH:", displayMode);
  });
  ```

6. ios에서 설치하는 법

- 공유 버튼 클릭
- 홈 화면에 추가하기 클릭
- 추가 버튼 클릭
