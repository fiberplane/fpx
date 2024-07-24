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

  const [createdRecord] = await db
    .insert(settings)
    .values({ content: {} })
    .returning();

  return createdRecord;
}

export const GPT_4o = "gpt-4o";
export const GPT_4_TURBO = "gpt-4-turbo";
// NOTE - This was not working with our current prompting logic
//        We get this error: https://community.openai.com/t/error-code-400-for-repetitive-prompt-patterns/627157/7
//        It seems to have to do with the prompt data we inject? IDK.
export const GPT_3_5_TURBO = "gpt-3.5-turbo";

const OpenAiModelSchema = z.union([
  z.literal(GPT_4o),
  z.literal(GPT_4_TURBO),
  // z.literal(GPT_3_5_TURBO),
]);

type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

export const isValidOpenaiModel = (value: string): value is OpenAiModel =>
  OpenAiModelSchema.safeParse(value).success;

export const OpenAiModelOptions = {
  [GPT_4o]: "GPT-4o",
  [GPT_4_TURBO]: "GPT-4 Turbo",
  // [GPT_3_5_TURBO]: "GPT-3.5 Turbo",
} as const;

export const CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20240620";
export const CLAUDE_3_OPUS = "claude-3-opus-20240229";
export const CLAUDE_3_SONNET = "claude-3-sonnet-20240229";
export const CLAUDE_3_HAIKU = "claude-3-haiku-20240307";

const AnthropicModelSchema = z.union([
  z.literal(CLAUDE_3_5_SONNET),
  z.literal(CLAUDE_3_OPUS),
  z.literal(CLAUDE_3_SONNET),
  z.literal(CLAUDE_3_HAIKU),
]);

type AnthropicModel = z.infer<typeof AnthropicModelSchema>;

export const isValidAnthropicModel = (value: string): value is AnthropicModel =>
  AnthropicModelSchema.safeParse(value).success;

export const AnthropicModelOptions = {
  [CLAUDE_3_5_SONNET]: "Claude 3.5 Sonnet",
  [CLAUDE_3_OPUS]: "Claude 3 Opus",
  [CLAUDE_3_SONNET]: "Claude 3 Sonnet",
  [CLAUDE_3_HAIKU]: "Claude 3 Haiku",
} as const;

const ProviderTypeSchema = z.union([
  z.literal("openai"),
  z.literal("anthropic"),
]);

type Provider = z.infer<typeof ProviderTypeSchema>;

export const isValidProvider = (value?: string): value is Provider =>
  ProviderTypeSchema.safeParse(value).success;

export const ProviderOptions = {
  openai: "OpenAI",
  anthropic: "Anthropic",
} as const;

export const FormSchema = z.object({
  customRoutesEnabled: z.boolean().optional(),
  aiEnabled: z.boolean().optional(),
  aiProviderType: ProviderTypeSchema.optional(),
  openaiApiKey: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  openaiModel: OpenAiModelSchema.optional(),
  anthropicApiKey: z.string().optional(),
  anthropicBaseUrl: z.string().optional(),
  anthropicModel: AnthropicModelSchema.optional(),
});

export async function getInferenceConfig(db: LibSQLDatabase<typeof schema>) {
  const settingsRecords = await db.select().from(settings);

  if (settingsRecords.length > 0) {
    const content = settingsRecords[0]?.content;
    const { success, data: settings } = FormSchema.safeParse(content);
    if (success) {
      return settings;
    }
  }

  return null;
}
