import { createAnthropic } from "@ai-sdk/anthropic";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import type { Settings } from "@fiberplane/fpx-types";
import { type APICallError, generateObject } from "ai";
import { createOllama } from "ollama-ai-provider";
import logger from "../../logger/index.js";
import { generateRequestWithFp } from "./fp.js";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts.js";
import { makeRequestTool, requestSchema } from "./tools.js";

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

  if (aiProvider === "ollama") {
    const ollama = createOllama({
      baseURL: providerConfig.baseUrl ?? undefined,
    });

    return ollama(providerConfig.model);
  }

  // TODO add support for fp
  throw new Error("Unknown AI provider");
}

export async function generateRequestWithAiProvider({
  fpApiKey,
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
  prompt,
}: {
  fpApiKey?: string;
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
  prompt?: string;
}) {
  const { aiProviderConfigurations, aiProvider } = inferenceConfig;
  const aiEnabled = hasValidAiConfig(inferenceConfig);
  if (!aiEnabled) {
    return { data: null, error: { message: "AI is not enabled" } };
  }

  if (!aiProvider) {
    return { data: null, error: { message: "AI provider is not set" } };
  }

  if (aiProvider === "fp") {
    if (!fpApiKey) {
      return {
        data: null,
        error: { message: "Fiberplane token not found" },
      };
    }
    return generateRequestWithFp({
      fpApiKey,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
      persona,
      method,
      path,
      prompt,
    });
  }

  if (!aiProviderConfigurations || !aiProviderConfigurations[aiProvider]) {
    return {
      data: null,
      error: { message: "AI provider is not configured properly" },
    };
  }

  const providerConfig = aiProviderConfigurations[aiProvider];

  const provider = configureProvider(aiProvider, providerConfig);

  logger.debug("Generating request with AI provider", {
    aiProvider,
    providerConfig,
  });

  try {
    const samplePrompt = `
I need to make a request to one of my Hono api handlers.

Here are some recent requests/responses, which you can use as inspiration for future requests.
E.g., if we recently created a resource, you can look that resource up.

<history>
</history>

The request you make should be a GET request to route: /api/geese/:id

Here is the OpenAPI spec for the handler:
<openapi/>

Here is the middleware that will be applied to the request:
<middleware/>

Here is some additional context for the middleware that will be applied to the request:
<middlewareContext/>

Here is the code for the handler:
<code/>

Here is some additional context for the handler source code, if you need it:
<context/>
`;

    const userPrompt = await invokeRequestGenerationPrompt({
      persona,
      method,
      path,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
      prompt,
    });

    const systemPrompt = getSystemPrompt(persona, aiProvider);

    const {
      object: generatedObject,
      warnings,
      usage,
    } = await generateObject({
      model: provider,
      schema: requestSchema,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: samplePrompt },
        {
          role: "assistant",
          content: [
            {
              type: "tool-call",
              toolCallId: "call_1",
              toolName: "make_request",
              args: makeRequestTool,
            },
          ],
        },
        {
          role: "tool",
          content: [
            {
              type: "tool-result",
              toolCallId: "call_1",
              toolName: "make_request",
              result: JSON.stringify({
                path: "/api/users/123",
                pathParams: [{ key: ":id", value: "123" }],
                queryParams: [
                  { key: "include", value: "profile" },
                  { key: "fields", value: "name,email" },
                ],
                body: JSON.stringify({
                  name: "John Doe",
                  email: "john@example.com",
                }),
                bodyType: { type: "json", isMultipart: false },
                headers: [],
              }),
            },
          ],
        },
        { role: "user", content: userPrompt },
      ],
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
    const errorMessage = createErrorMessage(error);
    logger.debug("Error message", { errorMessage });
    return {
      data: null,
      error: { message: errorMessage },
    };
  }
}

function createErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "responseBody" in error) {
    return `${(error as APICallError).message}: ${(error as APICallError).responseBody}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Error generating request with AI provider";
}

// NOTE - Copy-pasted from frontend
export function hasValidAiConfig(settings: Settings | undefined) {
  if (!settings) {
    return false;
  }
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
    case "ollama": {
      const ollama = settings.aiProviderConfigurations?.ollama;
      const model = ollama?.model;
      return !!model;
    }
    case "fp": {
      return true;
    }
    default:
      return false;
  }
}
