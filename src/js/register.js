// Register
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then((registration) => {
        // run after register -> install -> activate
        console.log("Service Worker is registered", registration);

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
      })
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
      .catch((err) => {
        console.error("Registration failed:", err);
      });
  });
}
