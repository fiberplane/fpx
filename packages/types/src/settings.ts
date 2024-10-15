import type { AnthropicProvider } from "@ai-sdk/anthropic";
import type { MistralProvider } from "@ai-sdk/mistral";
import type { OpenAIProvider } from "@ai-sdk/openai";
import { z } from "zod";

export type MistralModelOptionsType = MistralProvider extends (
  modelId: infer T,
  ...args: unknown[]
) => unknown
  ? T
  : never;

export const MistralModelOptions: Partial<
  Record<MistralModelOptionsType, string>
> = {
  "open-mistral-7b": "Open Mistral 7B",
  "open-mixtral-8x7b": "Open Mixtral 8x7B",
  "open-mixtral-8x22b": "Open Mixtral 8x22B",
  "open-mistral-nemo": "Open Mistral Nemo",
  "pixtral-12b-2409": "Pixtral 12B",
  "mistral-small-latest": "Mistral Small (Latest)",
  "mistral-large-latest": "Mistral Large (Latest)",
};

export const MistralModelSchema = z.union([
  z.literal("open-mistral-7b"),
  z.literal("open-mixtral-8x7b"),
  z.literal("open-mixtral-8x22b"),
  z.literal("open-mistral-nemo"),
  z.literal("pixtral-12b-2409"),
  z.literal("mistral-small-latest"),
  z.literal("mistral-large-latest"),
]);

export type AnthropicModelOptionsType = AnthropicProvider extends (
  modelId: infer T,
  ...args: unknown[]
) => unknown
  ? T
  : never;

export const AnthropicModelOptions: Partial<
  Record<AnthropicModelOptionsType, string>
> = {
  "claude-3-opus-20240229": "Claude 3 Opus",
  "claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "claude-3-haiku-20240307": "Claude 3 Haiku",
  "claude-3-5-sonnet-20240620": "Claude 3.5 Sonnet",
};

export const AnthropicModelSchema = z.union([
  z.literal("claude-3-opus-20240229"),
  z.literal("claude-3-sonnet-20240229"),
  z.literal("claude-3-haiku-20240307"),
  z.literal("claude-3-5-sonnet-20240620"),
]);

export type AnthropicModel = z.infer<typeof AnthropicModelSchema>;

export type OpenAIModelOptionsType = OpenAIProvider extends (
  modelId: infer T,
  ...args: unknown[]
) => unknown
  ? T
  : never;

export const OpenAIModelOptions: Partial<
  Record<OpenAIModelOptionsType, string>
> = {
  "gpt-4": "GPT-4",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4-turbo": "GPT-4 Turbo",
};

export const OpenAIModelSchema = z.union([
  z.literal("gpt-4"),
  z.literal("gpt-3.5-turbo"),
  z.literal("gpt-4o"),
  z.literal("gpt-4o-mini"),
  z.literal("gpt-4-turbo"),
]);

export type OpenAIModel = z.infer<typeof OpenAIModelSchema>;

export const ProviderOptions = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  mistral: "Mistral",
} as const;

export const AiProviderTypeSchema = z.union([
  z.literal("openai"),
  z.literal("anthropic"),
  z.literal("mistral"),
]);

export type AiProviderType = z.infer<typeof AiProviderTypeSchema>;

export const SettingsSchema = z.object({
  aiEnabled: z.boolean().optional(),
  aiProvider: AiProviderTypeSchema.optional(),
  aiProviderConfigurations: z
    .record(
      AiProviderTypeSchema,
      z.object({
        apiKey: z.string(),
        baseUrl: z.string().optional(),
        model: z.string(),
      }),
    )
    .optional(),
  proxyBaseUrl: z.string().optional(),
  proxyRequestsEnabled: z.boolean().optional(),
  webhoncConnectionId: z.string().optional(),
  fpxWorkerProxy: z
    .object({
      enabled: z.boolean().optional(),
      // Optional seems broken on urls with react-hook-form and controlled inputs resulting into empty strings
      // Fix from:
      // https://github.com/colinhacks/zod/discussions/1254#discussioncomment-3123225
      baseUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
    })
    .optional(),
});

export const SettingsSchemaOld = z.object({
  aiEnabled: z.boolean().optional(),
  aiProviderType: AiProviderTypeSchema.optional(),
  anthropicApiKey: z.string().optional(),
  anthropicBaseUrl: z.string().optional(),
  anthropicModel: AnthropicModelSchema.optional(),
  fpxWorkerProxy: z
    .object({
      enabled: z.boolean().optional(),
      // Optional seems broken on urls with react-hook-form and controlled inputs resulting into empty strings
      // Fix from:
      // https://github.com/colinhacks/zod/discussions/1254#discussioncomment-3123225
      baseUrl: z.union([z.literal(""), z.string().trim().url()]).optional(),
    })
    .optional(),
  openaiApiKey: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  openaiModel: OpenAIModelSchema.optional(),
  proxyBaseUrl: z.string().optional(),
  proxyRequestsEnabled: z.boolean().optional(),
  webhoncConnectionId: z.string().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export type SettingsKey = keyof Settings;
