import type { AnthropicProvider } from "@ai-sdk/anthropic";
import type { MistralProvider } from "@ai-sdk/mistral";
import type { OpenAIProvider } from "@ai-sdk/openai";
import type { OllamaProvider } from "ollama-ai-provider";
import { z } from "zod";

export type MistralModelOptionsType = Parameters<MistralProvider>[0];

export const MistralModelOptions: Partial<
  Record<MistralModelOptionsType, string>
> = {
  "open-mistral-7b": "Open Mistral 7B",
  "open-mixtral-8x7b": "Open Mixtral 8x7B",
  "open-mixtral-8x22b": "Open Mixtral 8x22B",
  "open-mistral-nemo": "Open Mistral Nemo",
  "mistral-small-latest": "Mistral Small (Latest)",
  "mistral-large-latest": "Mistral Large (Latest)",
};

export const MistralModelSchema = z.union([
  z.literal("open-mistral-7b"),
  z.literal("open-mixtral-8x7b"),
  z.literal("open-mixtral-8x22b"),
  z.literal("open-mistral-nemo"),
  z.literal("mistral-small-latest"),
  z.literal("mistral-large-latest"),
]);

export type AnthropicModelOptionsType = Parameters<AnthropicProvider>[0];

export const AnthropicModelOptions: Partial<
  Record<AnthropicModelOptionsType, string>
> = {
  "claude-3-opus-20240229": "Claude 3 Opus",
  "claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "claude-3-haiku-20240307": "Claude 3 Haiku",
  "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
  "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
};

export const AnthropicModelSchema = z.union([
  z.literal("claude-3-opus-20240229"),
  z.literal("claude-3-sonnet-20240229"),
  z.literal("claude-3-haiku-20240307"),
  z.literal("claude-3-5-haiku-20241022"),
  z.literal("claude-3-5-sonnet-20240620"),
  z.literal("claude-3-5-sonnet-20241022"),
]);

export type AnthropicModel = z.infer<typeof AnthropicModelSchema>;

export type OllamaModelOptionsType = Parameters<OllamaProvider>[0];

export const OllamaModelOptions: Partial<
  Record<OllamaModelOptionsType, string>
> = {
  "llama3.1": "LLAMA 3.1",
  "llama3.1:8b": "LLAMA 3.1 8B",
  "llama3.1:70b": "LLAMA 3.1 70B",
  "llama3.2": "LLAMA 3.2",
  "llama3.2:1b": "LLAMA 3.2 1B",
  "llama3.2:3b": "LLAMA 3.2 3B",
};

export type OpenAIModelOptionsType = Parameters<OpenAIProvider>[0];

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
  fp: "Fiberplane",
  ollama: "Ollama",
  mistral: "Mistral",
} as const;

export const AiProviderTypeSchema = z.union([
  z.literal("openai"),
  z.literal("anthropic"),
  z.literal("fp"),
  z.literal("ollama"),
  z.literal("mistral"),
]);

export type AiProviderType = z.infer<typeof AiProviderTypeSchema>;

export const SettingsSchema = z.object({
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
  openApiSpecUrl: z.string().optional(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export type SettingsKey = keyof Settings;
