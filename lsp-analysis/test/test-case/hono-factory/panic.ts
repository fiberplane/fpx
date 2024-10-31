import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => {
  c.status(500);
  return c.text("Panic!");
});

export { app as panic };
