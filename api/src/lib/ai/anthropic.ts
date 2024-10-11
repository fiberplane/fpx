import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_3_5_SONNET } from "@fiberplane/fpx-types";
import logger from "../../logger.js";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts.js";
import { makeRequestTool as makeRequestToolBase } from "./tools.js";

// Convert the tool call into the format that Anthropic suggests (different than openai's api)
const makeRequestTool = {
  name: makeRequestToolBase.function.name,
  description: makeRequestToolBase.function.description,
  input_schema: makeRequestToolBase.function.parameters,
};

type GenerateRequestOptions = {
  apiKey: string;
  model: string;
  persona: string;
  method: string;
  path: string;
  handler: string;
  baseUrl?: string;
  history?: Array<string>;
  handlerContext?: string;
  openApiSpec?: string;
  middleware?: {
    handler: string;
    method: string;
    path: string;
  }[];
  middlewareContext?: string;
};

/**
 * Generates request data for a route handler
 * - uses Anthropic's tool-calling feature.
 * - returns the request data as JSON.
 *
 * See the JSON Schema definition for the request data in the `make_request` tool.
 */
export async function generateRequestWithAnthropic({
  apiKey,
  baseUrl,
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
}: GenerateRequestOptions) {
  logger.debug(
    "Generating request data with Anthropic",
    `model: ${model}`,
    `baseUrl: ${baseUrl}`,
    `persona: ${persona}`,
    `method: ${method}`,
    `path: ${path}`,
    `handler: ${handler}`,
    // `handlerContext: ${handlerContext}`,
    // `openApiSpec: ${openApiSpec}`,
    // `middleware: ${middleware}`,
    // `middlewareContext: ${middlewareContext}`,
  );
  const anthropicClient = new Anthropic({ apiKey, baseURL: baseUrl });
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

  const toolChoice: Anthropic.Messages.MessageCreateParams.ToolChoiceTool = {
    type: "tool",
    name: makeRequestTool.name,
  };

  const systemPrompt = getSystemPrompt(persona, model === CLAUDE_3_5_SONNET);

  const response = await anthropicClient.messages.create({
    model,
    tool_choice: toolChoice,
    tools: [makeRequestTool],
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.06,
    max_tokens: 2048,
  });

  const { content } = response;

  let toolArgs: Anthropic.Messages.ToolUseBlock["input"];
  for (const message of content) {
    if (message.type === "tool_use") {
      logger.debug(
        "Anthropic tool use response:",
        JSON.stringify(message, null, 2),
      );
      toolArgs = message.input;
      return toolArgs;
    }
  }

  logger.error(
    "Parsing tool-call response from Anthropic failed. Response content:",
    JSON.stringify(content, null, 2),
  );
  throw new Error("Could not parse response from Anthropic");
}
