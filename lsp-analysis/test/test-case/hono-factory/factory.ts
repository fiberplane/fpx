import { Hono } from "hono";

export function createApp() {
  // biome-ignore lint/style/useConst: test separation of declaration & initialization
  let app: Hono;
  app = new Hono();
  app.get("/", (c) => c.text("Hello, Hono!"));

  return app;
}
