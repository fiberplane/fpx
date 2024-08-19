import { type Settings, SettingSchema, type SettingsKey, type Setting } from '@fiberplane/fpx-types';
import { eq, sql } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { z } from "zod";
import { settings } from "../../db/schema.js";
import type * as schema from "../../db/schema.js";

export async function upsertSettings(db: LibSQLDatabase<typeof schema>, content: Settings) {
  const settingsToUpdate = Object.entries(content).map(([key, value]) => ({
    key,
    value: JSON.stringify(value),
  }));

  return await db
    .insert(settings)
    .values(settingsToUpdate)
    .onConflictDoUpdate({
      target: [settings.key],
      set: { value: sql`excluded.value` },
    })
    .returning();
}

export async function getSetting<T extends SettingsKey>(
  db: LibSQLDatabase<typeof schema>,
  key: T,
): Promise<Omit<Extract<Setting, { type: T }>, 'type'> | undefined> {
  const [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, String(key)))
    .limit(1);

  if (!setting) {
    return;
  }

  return parseSetting(key, setting.value);
}

export async function getAllSettings(db: LibSQLDatabase<typeof schema>) {
  const settingsRecords = await db.select().from(settings);

  if (settingsRecords.length === 0) return {};

  return settingsRecords.reduce<Settings>(
    (acc, rec) => {
      acc[rec.key as SettingsKey] = parseSetting(rec.key, rec.value)
      return acc;
    },
    {},
  );
}

function parseSetting<T extends SettingsKey>(type: string, value: string) {
  const parsedJson = JSON.parse(value);
  const { type: _type, ...props } = SettingSchema.parse({ type, ...parsedJson });
  return props as Omit<Extract<Setting, { type: T }>, "type">;
}

// // HACK: This is a temporary solution to handle boolean and number values,
// // since all the settings are currently stored as strings.
// // Revisit this once db schema is updated
// function normalize(value: string): boolean | number | string {
//   const lowerValue = value.toLowerCase();
//
//   // Check for boolean values
//   if (lowerValue === "true" || lowerValue === "1" || lowerValue === "1.0")
//     return true;
//   if (lowerValue === "false" || lowerValue === "0" || lowerValue === "0.0")
//     return false;
//
//   // Check for any letter
//   if (/[a-zA-Z]/.test(value)) {
//     return value;
//   }
//
//   // Check for number
//   const numberValue = Number.parseFloat(value);
//   if (!Number.isNaN(numberValue)) return numberValue;
//
//   // Return as string if not boolean or number
//   return value;
// }
//
// function denormalizeType(value: boolean | number | string): {
//   value: string;
//   type: "boolean" | "number" | "string";
// } {
//   if (typeof value === "boolean") {
//     return { value: value ? "1.0" : "0.0", type: "boolean" };
//   }
//   if (typeof value === "number") {
//     return { value: value.toString(), type: "number" };
//   }
//   return { value: value, type: "string" };
// }

// NOTE - gpt-3.5-turbo was not working with our current prompting logic
//        We would get this error: https://community.openai.com/t/error-code-400-for-repetitive-prompt-patterns/627157/7
//        It seems to have to do with the prompt data we inject? IDK.

export const GPT_4o = "gpt-4o";
export const GPT_4o_MINI = "gpt-4o-mini";
export const GPT_4_TURBO = "gpt-4-turbo";

const OpenAiModelSchema = z.union([
  z.literal(GPT_4o),
  z.literal(GPT_4o_MINI),
  z.literal(GPT_4_TURBO),
]);

type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

export const isValidOpenaiModel = (value: string): value is OpenAiModel =>
  OpenAiModelSchema.safeParse(value).success;

export const OpenAiModelOptions = {
  [GPT_4o]: "GPT-4o",
  [GPT_4o_MINI]: "GPT-4o Mini",
  [GPT_4_TURBO]: "GPT-4 Turbo",
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

export type UserSettings = z.infer<typeof FormSchema>;

export async function getInferenceConfig(db: LibSQLDatabase<typeof schema>) {
  const settingsRecords = await getAllSettings(db);

  if (Object.keys(settingsRecords).length > 0) {
    const { success, data: settings } = FormSchema.safeParse(settingsRecords);
    if (success) {
      return settings;
    }
  }

  return;
}
