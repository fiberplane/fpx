import type { Settings } from "@fiberplane/fpx-types";
import { generateRequestWithAnthropic } from "./anthropic.js";
import { generateRequestWithOllama } from "./ollama.js";
import { generateRequestWithOpenAI } from "./openai.js";

export async function generateRequestWithAiProvider({
  inferenceConfig,
  persona,
  method,
  path,
  handler,
  handlerContext,
  history,
  openApiSpec,
  middleware,
  middlewareContext,
}: {
  inferenceConfig: Settings;
  persona: string;
  method: string;
  path: string;
  handler: string;
  handlerContext?: string;
  history?: string[];
  openApiSpec?: string;
  middleware?: {
    handler: string;
    method: string;
    path: string;
  }[];
  middlewareContext?: string;
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
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
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
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
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

  if (aiProviderType === "ollama") {
    return generateRequestWithOllama({
      apiKey: "",
      model: "llama3.1",
      baseUrl: "http://localhost:11434",
      persona,
      method,
      path,
      handler,
      handlerContext,
      // TODO - Add history, middleware, etc
    }).then(
      (parsedArgs) => {
        console.log(parsedArgs);
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
