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

app.get("/api/geese", async (c) => {
  const geese = await c.env.DB.prepare("SELECT * FROM geese").all();
  return c.json({ geese });
});


export default app;
