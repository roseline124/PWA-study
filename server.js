const Koa = require("koa");
const app = new Koa();

// response
app.use((ctx) => {
  ctx.body = "Hello Koa";
});

app.listen(3000, () => {
  console.log("🔥Listening to http://localhost:3000");
});
