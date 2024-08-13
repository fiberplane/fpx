import { Hono } from "hono";
import { cors } from "hono/cors";
import { getAllSettings, upsertSettings } from "../lib/settings/index.js";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Get the **signular** settings record from the database
 * If it doesn't exist, create it.
 */
app.get("/v0/settings", cors(), async (ctx) => {
  const db = ctx.get("db");
  const settingsRecord = await getAllSettings(db);
  return ctx.json(settingsRecord);
});

/**
 * Get the **signular** settings record from the database,
 * and update its content.
 * If it doesn't exist, create it, then update it.
 */
app.post("/v0/settings", cors(), async (ctx) => {
  const { content } = await ctx.req.json();
  const db = ctx.get("db");
  const updatedSettings = upsertSettings(db, content);
  return ctx.json(updatedSettings);
});

export default app;
