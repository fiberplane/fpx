import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { instrument } from "@fiberplane/hono-otel";
import * as schema from "./db/schema";

type Bindings = {
  DB: D1Database;
  AI: Ai;
  GOOSIFY_KV: KVNamespace;
  GOOSIFY_R2: R2Bucket;
  FPX_ENDPOINT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/api/geese", async (c) => {
  // NOTE - This is equivalent to a raw D1 query
  // const geese = await c.env.DB.prepare("SELECT * FROM geese").all();
  const db = drizzle(c.env.DB);
  const geese = await db.select().from(schema.geese);
  return c.json({ geese });
});

export default instrument(app);
