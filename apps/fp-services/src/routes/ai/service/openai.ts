import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import type { GenerateRequestOptions } from "../types";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts";
import { requestSchema } from "./schema";

const logger = {
  debug: (...args: unknown[]) => console.debug(...args),
  error: (...args: unknown[]) => console.error(...args),
};

/**
 * Generates request data for a route handler
 * - uses OpenAI's tool-calling feature.
 * - returns the request data as JSON.
 *
 * See the JSON Schema definition for the request data in the `make_request` tool.
 */
export async function generateRequestWithOpenAI({
  apiKey,
  model,
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
}: GenerateRequestOptions & { model: string; apiKey: string }) {
  logger.debug(
    "Generating request data with OpenAI",
    `model: ${model}`,
    `persona: ${persona}`,
    `method: ${method}`,
    `path: ${path}`,
    // `handler: ${handler}`,
    // `handlerContext: ${handlerContext}`,
    // `openApiSpec: ${openApiSpec}`,
    // `middleware: ${middleware}`,
    // `middlewareContext: ${middlewareContext}`,
  );
  const openaiClient = createOpenAI({
    apiKey,
  });

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

  const openai = openaiClient(model, {
    // NOTE - Later models (gpt-4o, gpt-4-turbo) should guarantee function calling to have json output
    structuredOutputs: true,
  });

  const {
    object: generatedObject,
    warnings,
    usage,
  } = await generateObject({
    model: openai,
    schema: requestSchema,
    prompt: userPrompt,
    system: getSystemPrompt(persona),
    temperature: 0.12,
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
}
