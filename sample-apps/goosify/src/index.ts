import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  AI: Ai;
  GOOSIFY_KV: KVNamespace;
  GOOSIFY_R2: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

export default app;
