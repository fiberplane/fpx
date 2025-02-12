import { createOpenAI } from "@ai-sdk/openai";

export const getActiveModel = (apiKey: string) => {
  const provider = createOpenAI({
    apiKey,
  });

  return provider("gpt-4o-mini");
};
