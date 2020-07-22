const Koa = require("koa");
const serve = require("koa-static");
const send = require("koa-send");

const app = new Koa();

app.use(serve(__dirname));
app.use(async (ctx) => {
  await send(ctx, "index.html");
});

app.listen(3000, () => {
  console.log("🔥Listening to http://localhost:3000");
});
