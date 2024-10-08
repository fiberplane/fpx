import type { OtelTrace } from "@fiberplane/fpx-types";
import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import logger from "../../logger.js";
import {
  getSystemPrompt,
  invokeRequestGenerationPrompt,
  invokeDiffGeneratorPrompt,
} from "./prompts.js";
import { GitDiffSchema, type FileType } from "./schema.js";
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
  middleware?: {
    handler: string;
    method: string;
    path: string;
  }[];
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
  middleware,
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
    `middleware: ${middleware}`,
  );
  const openaiClient = new OpenAI({ apiKey, baseURL: baseUrl });
  const userPrompt = await invokeRequestGenerationPrompt({
    persona,
    method,
    path,
    handler,
    history,
    openApiSpec,
    middleware,
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

export async function generateDiffWithCreatedTestOpenAI({
  apiKey,
  baseUrl,
  model,
  trace,
  relevantFiles,
}: {
  apiKey: string;
  baseUrl?: string;
  model: string;
  trace: OtelTrace;
  relevantFiles: FileType[];
}) {
  const diffJsonSchema = zodToJsonSchema(GitDiffSchema);

  const openaiClient = new OpenAI({ apiKey, baseURL: baseUrl });
  const userPrompt = await invokeDiffGeneratorPrompt({
    trace,
    relevantFiles,
    diffJsonSchema,
  });

  const response = await openaiClient.chat.completions.create({
    model,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    functions: [
      {
        name: diffJsonSchema.title ?? "generateDiff",
        description: "Generate a diff for the created test",
        parameters: diffJsonSchema,
      },
    ],
    function_call: { name: diffJsonSchema.title ?? "generateDiff" },
    temperature: 0.06,
    max_tokens: 2048,
  });

  const {
    choices: [{ message }],
  } = response;

  const functionCall = message.function_call;

  if (
    functionCall &&
    functionCall.name === (diffJsonSchema.title ?? "generateDiff")
  ) {
    try {
      const parsedArgs = JSON.parse(functionCall.arguments ?? "{}");
      return parsedArgs;
    } catch (error) {
      logger.error("Parsing function call response from OpenAI failed:", error);
      throw new Error("Could not parse response from OpenAI");
    }
  }

  logger.error(
    "OpenAI response did not contain expected function call. Response:",
    JSON.stringify(message, null, 2),
  );
  throw new Error("Unexpected response format from OpenAI");
}
