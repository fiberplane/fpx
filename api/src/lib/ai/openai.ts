import OpenAI from "openai";
import logger from "../../logger.js";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts.js";
import { makeRequestTool } from "./tools.js";

type GenerateRequestOptions = {
  apiKey: string;
  baseUrl?: string;
  model: string;
  persona: string;
  method: string;
  path: string;
  handler: string;
  history?: Array<string>;
  openApiSpec?: string;
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
  baseUrl,
  model,
  persona,
  method,
  path,
  handler,
  history,
  openApiSpec,
}: GenerateRequestOptions) {
  logger.debug(
    "Generating request data with OpenAI",
    `model: ${model}`,
    `baseUrl: ${baseUrl}`,
    `persona: ${persona}`,
    `method: ${method}`,
    `path: ${path}`,
    `handler: ${handler}`,
    `openApiSpec: ${openApiSpec}`,
  );
  const openaiClient = new OpenAI({ apiKey, baseURL: baseUrl });
  const userPrompt = await invokeRequestGenerationPrompt({
    persona,
    method,
    path,
    handler,
    history,
    openApiSpec
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
