import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import type { Settings } from "@fiberplane/fpx-types";
import { generateObject } from "ai";
import logger from "../../logger.js";
import { invokeRequestGenerationPrompt } from "./prompts.js";
import { requestSchema } from "./tools.js";

function getProvider(
  aiProvider: string,
  providerConfig: {
    apiKey: string;
    baseUrl?: string | undefined;
    model: string;
  },
) {
  if (aiProvider === "openai") {
    const openai = createOpenAI({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseUrl,
    });
    return openai(providerConfig.model, { structuredOutputs: true });
  }
  if (aiProvider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseUrl,
    });
    return anthropic(providerConfig.model);
  }

  if (aiProvider === "mistral") {
    const mistral = createMistral({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseUrl,
    });
    return mistral(providerConfig.model);
  }

  throw new Error("Unknown AI provider");
}

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
  const { aiEnabled, aiProviderConfigurations, aiProvider } = inferenceConfig;
  if (!aiEnabled) {
    return { data: null, error: { message: "AI is not enabled" } };
  }

  if (!aiProvider) {
    return { data: null, error: { message: "AI provider is not set" } };
  }

  const providerConfig = aiProviderConfigurations[aiProvider];
  if (!providerConfig) {
    return {
      data: null,
      error: { message: "AI provider is not configured properly" },
    };
  }

  const provider = getProvider(aiProvider, providerConfig);
  logger.debug("Generating request with AI provider", {
    aiProvider,
    providerConfig,
  });
  const { object: generatedObject } = await generateObject({
    model: provider,
    schema: requestSchema,
    prompt: await invokeRequestGenerationPrompt({
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
      persona,
      method,
      path,
    }),
  });

  return { data: generatedObject, error: null };
}
