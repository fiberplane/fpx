import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default instrument(app);
