import { Hono } from "hono";
import bye from "./bye";
import { panic } from "./panic";
import { silence } from "./silence";

export function createApp() {
  // biome-ignore lint/style/useConst: test separation of declaration & initialization
  let app: Hono;
  app = new Hono();
  app.get("/", (c) => c.text("Hello, Hono!"));
  app.route("/bye", bye);
  app.route("/silence", silence);
  app.route("/panic", panic);
  return app;
}
