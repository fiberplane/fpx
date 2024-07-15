import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { cors } from "hono/cors";
import z from "zod";
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

export async function findOrCreateSettings(db: LibSQLDatabase<typeof schema>) {
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

const ApiKeySettingSchema = z
  .object({
    openaiApiKey: z.string(),
  })
  .passthrough();

type ApiKeySetting = z.infer<typeof ApiKeySettingSchema>;

const GPT_4o = "gpt-4o";
const GPT_4_TURBO = "gpt-4-turbo";
const GPT_3_5_TURBO = "gpt-3.5-turbo";

const OpenAiModelSchema = z.union([z.literal(GPT_4o), z.literal(GPT_4_TURBO), z.literal(GPT_3_5_TURBO)]);

type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

const isOpenAiModel = (model: unknown): model is OpenAiModel => {
  return OpenAiModelSchema.safeParse(model).success;
};

const hasOpenAiApiKey = (content: unknown): content is ApiKeySetting => {
  return ApiKeySettingSchema.safeParse(content).success;
};

export async function getOpenAiConfig(db: LibSQLDatabase<typeof schema>) {
  const settingsRecords = await db.select().from(settings);

  if (settingsRecords.length > 0) {
    const content = settingsRecords[0]?.content;
    if (hasOpenAiApiKey(content)) {
      const model = "openaiModel" in content ? content.openaiModel : "gpt-4o";
      return {
        openaiApiKey: content.openaiApiKey,
        openaiModel: isOpenAiModel(model) ? model : "gpt-4o",
      };
    }
  }

  return null;
}
