import { z } from "zod";

export const GPT_4o = "gpt-4o";
export const GPT_4_TURBO = "gpt-4-turbo";
// NOTE - This was not working with our current prompting logic
//        We get this error: https://community.openai.com/t/error-code-400-for-repetitive-prompt-patterns/627157/7
//        It seems to have to do with the prompt data we inject? IDK.
export const GPT_3_5_TURBO = "gpt-3.5-turbo";

const OpenAiModelSchema = z.union([
  z.literal(GPT_4o),
  z.literal(GPT_4_TURBO),
  z.literal(GPT_3_5_TURBO),
]);

type OpenAiModel = z.infer<typeof OpenAiModelSchema>;

export const isValidOpenaiModel = (value: string): value is OpenAiModel =>
  OpenAiModelSchema.safeParse(value).success;

export const FormSchema = z.object({
  ai_features: z.boolean(),
  openai_api_key: z.string().optional(),
  custom_routes: z.boolean(),
  openai_model: OpenAiModelSchema,
});
