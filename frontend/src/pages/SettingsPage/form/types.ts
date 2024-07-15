import { z } from "zod";

export const GPT_4o = "gpt-4o";
export const GPT_4_TURBO = "gpt-4-turbo";
export const GPT_3_5_TURBO = "gpt-3.5-turbo";

const OpenAiModelSchema = z.union([z.literal(GPT_4o), z.literal(GPT_4_TURBO), z.literal(GPT_3_5_TURBO)]);

type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

export const isValidOpenaiModel = (value: string): value is OpenAiModel =>
  OpenAiModelSchema.safeParse(value).success;

export const FormSchema = z.object({
  ai_features: z.boolean(),
  openai_api_key: z.string().optional(),
  custom_routes: z.boolean(),
  openai_model: OpenAiModelSchema,
});
