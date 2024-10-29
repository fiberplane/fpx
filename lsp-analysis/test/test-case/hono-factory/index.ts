import { Hono } from "hono";

function createApp() {
  const app = new Hono();
  app.get("/", (c) => c.text("Hello, Hono!"));
  return app;
}

const app = createApp();

const subHello = new Hono();
subHello.get("/", (c) => c.text("Hello, sub!"));
subHello.get("/bye", (c) => c.text("Bye, sub!"));

app.route("/sub", subHello);

export default app;
