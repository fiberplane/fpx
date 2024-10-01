import { drizzle } from "drizzle-orm/d1";
/**
 * This file is used to test the static analysis of a codebase
 * with a route defined in a sub-router
 */
import { Hono } from "hono";
import * as schema from "./db/schema";

const app = new Hono<{ Bindings: { DB: D1Database } }>();

app.get("/", (c) => {
  console.log("Other Router");
  const url = new URL(c.req.url);
  return c.text(`Other Router: ${url}`);
});

app.get("/db", async (c) => {
  const db = drizzle(c.env.DB);
  const stuff = await db.select().from(schema.stuff);
  return c.json(stuff);
});

app.post("/db", async (c) => {
  const body = await c.req.json();
  const db = drizzle(c.env.DB);
  const stuff = await db.insert(schema.stuff).values(body).returning();
  return c.json(stuff);
});

export default app;
