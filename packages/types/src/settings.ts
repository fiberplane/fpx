import { z } from "zod";

export const ProviderOptions = {
  openai: "OpenAI",
  anthropic: "Anthropic",
} as const;

export const AiProviderTypeSchema = z.union([z.literal("openai"), z.literal("anthropic"),]);

export type AiProviderType = z.infer<typeof AiProviderTypeSchema>;

export const CLAUDE_3_5_SONNET = "claude-3-5-sonnet-20240620";
export const CLAUDE_3_OPUS = "claude-3-opus-20240229";
export const CLAUDE_3_SONNET = "claude-3-sonnet-20240229";
export const CLAUDE_3_HAIKU = "claude-3-haiku-20240307";

export const AnthropicModelOptions = {
  [CLAUDE_3_5_SONNET]: "Claude 3.5 Sonnet",
  [CLAUDE_3_OPUS]: "Claude 3 Opus",
  [CLAUDE_3_SONNET]: "Claude 3 Sonnet",
  [CLAUDE_3_HAIKU]: "Claude 3 Haiku",
} as const;

export const AnthropicModelSchema = z.union([
  z.literal(CLAUDE_3_5_SONNET),
  z.literal(CLAUDE_3_OPUS),
  z.literal(CLAUDE_3_SONNET),
  z.literal(CLAUDE_3_HAIKU),
]);

export type AnthropicModel = z.infer<typeof AnthropicModelSchema>;

export const GPT_4o = "gpt-4o";
export const GPT_4o_MINI = "gpt-4o-mini";
export const GPT_4_TURBO = "gpt-4-turbo";

export const OpenAiModelOptions = {
  [GPT_4o]: "GPT-4o",
  [GPT_4o_MINI]: "GPT-4o Mini",
  [GPT_4_TURBO]: "GPT-4 Turbo",
} as const;

export const OpenAiModelSchema = z.union([
  z.literal(GPT_4o),
  z.literal(GPT_4o_MINI),
  z.literal(GPT_4_TURBO),
]);

export type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

export const SettingsFormSchema = z.object({
  customRoutesEnabled: z.boolean().optional(),
  aiEnabled: z.boolean().optional(),
  aiProviderType: AiProviderTypeSchema.optional(),
  openaiApiKey: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  openaiModel: OpenAiModelSchema.optional(),
  anthropicApiKey: z.string().optional(),
  anthropicBaseUrl: z.string().optional(),
  anthropicModel: AnthropicModelSchema.optional(),
  proxyRequestsEnabled: z.boolean().optional(),
  proxyBaseUrl: z.string().optional(),
})

export type SettingsForm = z.infer<typeof SettingsFormSchema>;

export const SettingSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal('aiEnabled'), value: SettingsFormSchema.transform((schema) => schema.aiEnabled) }),
  z.object({ type: z.literal('aiProviderType'), value: SettingsFormSchema.transform((schema) => schema.aiProviderType) }),
  z.object({ type: z.literal('anthropicApiKey'), value: SettingsFormSchema.transform((schema) => schema.anthropicApiKey) }),
  z.object({ type: z.literal('anthropicBaseUrl'), value: SettingsFormSchema.transform((schema) => schema.anthropicBaseUrl) }),
  z.object({ type: z.literal('anthropicModel'), value: SettingsFormSchema.transform((schema) => schema.anthropicModel) }),
  z.object({ type: z.literal('customRoutesEnabled'), value: SettingsFormSchema.transform((schema) => schema.customRoutesEnabled) }),
  // z.object({ type: z.literal("fpxWorkerProxy"), value: SettingsFormSchema.transform((schema) => schema.fpxWorkerProxy) }),
  z.object({ type: z.literal('openaiApiKey'), value: SettingsFormSchema.transform((schema) => schema.openaiApiKey) }),
  z.object({ type: z.literal('openaiBaseUrl'), value: SettingsFormSchema.transform((schema) => schema.openaiBaseUrl) }),
  z.object({ type: z.literal('openaiModel'), value: SettingsFormSchema.transform((schema) => schema.openaiModel) }),
  z.object({ type: z.literal('proxyBaseUrl'), value: SettingsFormSchema.transform((schema) => schema.proxyBaseUrl) }),
  z.object({ type: z.literal('proxyRequestsEnabled'), value: SettingsFormSchema.transform((schema) => schema.proxyRequestsEnabled) }),
  // z.object({ type: z.literal('webhoncConnectionId'), value: SettingsFormSchema.transform((schema) => schema.webhoncConnectionId) }),


  // z.object({ type: z.literal('aiEnabled'), value: z.boolean().optional() }),
  // z.object({ type: z.literal('aiProviderType'), value: AiProviderTypeSchema.optional() }),
  // z.object({ type: z.literal('anthropicApiKey'), value: z.string().optional() }),
  // z.object({ type: z.literal('anthropicBaseUrl'), value: z.string().url().optional() }),
  // z.object({ type: z.literal('anthropicModel'), value: AnthropicModelSchema.optional() }),
  // z.object({ type: z.literal('customRoutesEnabled'), value: z.boolean().optional() }),
  // z.object({ type: z.literal("fpxWorkerProxy"), value: z.string().url().optional() }),
  // z.object({ type: z.literal('openaiApikey'), value: z.string().optional() }),
  // z.object({ type: z.literal('openaiBaseUrl'), value: z.string().url().optional() }),
  // z.object({ type: z.literal('openaiModel'), value: OpenAiModelSchema.optional() }),
  // z.object({ type: z.literal('proxyBaseUrl'), value: z.string().optional() }),
  // z.object({ type: z.literal('proxyRequestsEnabled'), value: z.boolean().optional() }),
  // z.object({ type: z.literal('webhoncConnectionId'), value: z.string().optional() }),
]);

export type Setting = z.infer<typeof SettingSchema>;

export type SettingsKey = Setting["type"];

export type Settings = Partial<Record<SettingsKey, Omit<Extract<Setting, { type: SettingsKey }>, 'type'>>>;
