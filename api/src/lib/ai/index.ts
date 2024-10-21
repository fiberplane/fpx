import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import type { Settings } from "@fiberplane/fpx-types";
import { generateObject } from "ai";
import logger from "../../logger.js";
import { generateRequestWithFp } from "./fp.js";
import { invokeRequestGenerationPrompt } from "./prompts.js";
import { requestSchema } from "./tools.js";

function configureProvider(
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
      baseURL: providerConfig.baseUrl ?? undefined,
    });
    return openai(providerConfig.model, { structuredOutputs: true });
  }
  if (aiProvider === "anthropic") {
    const anthropic = createAnthropic({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseUrl ?? undefined,
    });
    return anthropic(providerConfig.model);
  }

  if (aiProvider === "mistral") {
    const mistral = createMistral({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseUrl ?? undefined,
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
  const { aiProviderConfigurations, aiProvider } = inferenceConfig;
  const aiEnabled = hasValidAiConfig(inferenceConfig);
  if (!aiEnabled) {
    return { data: null, error: { message: "AI is not enabled" } };
  }

  if (!aiProvider) {
    return { data: null, error: { message: "AI provider is not set" } };
  }

  if (!aiProviderConfigurations || !aiProviderConfigurations[aiProvider]) {
    return {
      data: null,
      error: { message: "AI provider is not configured properly" },
    };
  }

  const providerConfig = aiProviderConfigurations[aiProvider];

  if (aiProvider === "fp") {
    // TODO - Invoke the fp request generation
    return generateRequestWithFp({
      apiKey: providerConfig.apiKey,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
      persona,
      method,
      path,
    });
  }

  const provider = configureProvider(aiProvider, providerConfig);

  logger.debug("Generating request with AI provider", {
    aiProvider,
    providerConfig,
  });

  try {
    const {
      object: generatedObject,
      warnings,
      usage,
    } = await generateObject({
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

    logger.debug("Generated object, warnings, usage", {
      generatedObject,
      warnings,
      usage,
    });

    // Remove x-fpx-trace-id header from the generated object
    const filteredHeaders = generatedObject?.headers?.filter(
      (header) => header.key.toLowerCase() !== "x-fpx-trace-id",
    );

    return {
      data: { ...generatedObject, headers: filteredHeaders },
      error: null,
    };
  } catch (error) {
    logger.error("Error generating request with AI provider", {
      error,
    });
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Error generating request with AI provider";
    return {
      data: null,
      error: { message: errorMessage },
    };
  }
}

// NOTE - Copy-pasted from frontend
function hasValidAiConfig(settings: Settings) {
  const provider = settings.aiProvider;
  switch (provider) {
    // HACK - Special logic for OpenAI to support someone who has set a baseUrl
    //        to use an openai compatible api
    case "openai": {
      const openai = settings.aiProviderConfigurations?.openai;
      const apiKey = openai?.apiKey;
      const model = openai?.model;
      const baseUrl = openai?.baseUrl;
      return (!!apiKey && !!model) || (!!baseUrl && !!model);
    }
    case "anthropic": {
      const anthropic = settings.aiProviderConfigurations?.anthropic;
      const apiKey = anthropic?.apiKey;
      const model = anthropic?.model;
      return !!apiKey && !!model;
    }
    case "mistral": {
      const mistral = settings.aiProviderConfigurations?.mistral;
      const apiKey = mistral?.apiKey;
      const model = mistral?.model;
      return !!apiKey && !!model;
    }
    default:
      return false;
  }
}
