const Koa = require("koa");
const serve = require("koa-static");
const send = require("koa-send");
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

const app = new Koa();

app.use(bodyParser());

app.use(serve(__dirname + "/build"));

app.use(async (ctx) => {
  ctx.body = ctx.request.body;

  switch (ctx.req.url) {
    case "/vapidPublicKey":
      ctx.body = process.env.VAPID_PUBLIC_KEY;
      break;
    case "/register":
      // TODO: store subscription information
      ctx.response.status = 201;
      break;
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

app.listen(3000, () => {
  console.log("🔥Listening to http://localhost:3000");
});
