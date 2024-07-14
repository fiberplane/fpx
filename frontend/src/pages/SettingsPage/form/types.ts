import { z } from "zod";

const OpenAiModelSchema = z.union([z.literal("gpt-4o"), z.literal("gpt-3.5")]);

type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

export const isValidOpenaiModel = (value: string): value is OpenAiModel =>
  OpenAiModelSchema.safeParse(value).success;

export const FormSchema = z.object({
  ai_features: z.boolean(),
  openai_api_key: z.string().optional(),
  custom_routes: z.boolean(),
  openai_model: OpenAiModelSchema,
});
