import type { Settings } from "@fiberplane/fpx-types";
import { generateRequestWithAnthropic } from "./anthropic.js";
import { generateRequestWithOpenAI } from "./openai.js";

export async function generateRequestWithAiProvider({
  inferenceConfig,
  persona,
  method,
  path,
  handler,
  history,
  openApiSpec,
  middleware,
}: {
  inferenceConfig: Settings;
  persona: string;
  method: string;
  path: string;
  handler: string;
  history?: string[];
  openApiSpec?: string;
  middleware?: {
    handler: string;
    method: string;
    path: string;
  }[];
}) {
  const {
    openaiApiKey,
    openaiModel,
    openaiBaseUrl,
    anthropicApiKey,
    anthropicModel,
    anthropicBaseUrl,
    aiProviderType,
  } = inferenceConfig;
  if (aiProviderType === "openai") {
    return generateRequestWithOpenAI({
      apiKey: openaiApiKey ?? "",
      model: openaiModel ?? "",
      baseUrl: openaiBaseUrl,
      persona,
      method,
      path,
      handler,
      history,
      openApiSpec,
      middleware,
    }).then(
      (parsedArgs) => {
        return { data: parsedArgs, error: null };
      },
      (error) => {
        if (error instanceof Error) {
          return { data: null, error: { message: error.message } };
        }
        return { data: null, error: { message: "Unknown error" } };
      },
    );
  }
  if (aiProviderType === "anthropic") {
    return generateRequestWithAnthropic({
      apiKey: anthropicApiKey ?? "",
      baseUrl: anthropicBaseUrl,
      model: anthropicModel ?? "",
      persona,
      method,
      path,
      handler,
      history,
      openApiSpec,
      middleware,
    }).then(
      (parsedArgs) => {
        return { data: parsedArgs, error: null };
      },
      (error) => {
        if (error instanceof Error) {
          return { data: null, error: { message: error.message } };
        }
        return { data: null, error: { message: "Unknown error" } };
      },
    );
  }

  return { data: null, error: { message: "Unknown AI provider" } };
}
