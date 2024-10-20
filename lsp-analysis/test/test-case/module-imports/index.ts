import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.get(
  "/",
  cors(),
  () => cors(),
  (c) => c.text("Hello, Hono!"),
);
export default app;
