import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";

const { settings } = schema;

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Get the **signular** settings record from the database
 * If it doesn't exist, create it.
 */
app.get("/v0/settings", cors(), async (ctx) => {
  const db = ctx.get("db");
  const settingsRecord = await findOrCreateSettings(db);
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
  const updatedSettings = updateSettings(db, content);
  return ctx.json(updatedSettings);
});

export default app;

async function updateSettings(
  db: LibSQLDatabase<typeof schema>,
  content: object,
) {
  const currentSettings = await findOrCreateSettings(db);
  return await db
    .update(settings)
    .set({ content })
    .where(eq(settings.id, currentSettings.id))
    .returning();
}

async function findOrCreateSettings(db: LibSQLDatabase<typeof schema>) {
  const settingsRecords = await db.select().from(settings);

  if (settingsRecords.length > 0) {
    return settingsRecords[0];
  }

  const createdRecord = await db
    .insert(settings)
    .values({ content: {} })
    .returning();

  return createdRecord[0];
}
