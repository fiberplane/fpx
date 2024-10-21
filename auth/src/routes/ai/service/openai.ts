import OpenAI from "openai";
import type { GenerateRequestOptions } from "../types";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts";
import { makeRequestTool } from "./tools";

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
  const openaiClient = new OpenAI({ apiKey });
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
  });

  const response = await openaiClient.chat.completions.create({
    // NOTE - Later models (gpt-4o, gpt-4-turbo) should guarantee function calling to have json output
    model,
    // NOTE - We can restrict the response to be from this single tool call
    tool_choice: {
      type: "function",
      function: { name: makeRequestTool.function.name },
    },
    // Define the make_request tool
    tools: [makeRequestTool],
    messages: [
      {
        role: "system",
        content: getSystemPrompt(persona),
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.12,
    max_tokens: 2048,
  });

  const {
    choices: [{ message }],
  } = response;

  const makeRequestCall = message.tool_calls?.[0];
  const toolArgs = makeRequestCall?.function?.arguments;

  try {
    const parsedArgs = toolArgs ? JSON.parse(toolArgs) : null;
    return parsedArgs;
  } catch (error) {
    logger.error("Parsing tool-call response from OpenAI failed:", error);
    throw new Error("Could not parse response from OpenAI");
  }
}
