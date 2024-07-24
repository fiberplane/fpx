import Anthropic from '@anthropic-ai/sdk';
import logger from "../../logger.js";
import {
  getSystemPrompt,
  invokeRequestGenerationPrompt,
} from "./prompts.js";
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
  baseURL: string;
  history?: Array<string>;
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
  baseURL,
  model,
  persona,
  method,
  path,
  handler,
  history,
}: GenerateRequestOptions) {
  const anthropicClient = new Anthropic({ apiKey, baseURL });
  const userPrompt = await invokeRequestGenerationPrompt({
    persona,
    method,
    path,
    handler,
    history,
  });

  const toolChoice: Anthropic.Messages.MessageCreateParams.ToolChoiceTool = {
    type: "tool",
    name: makeRequestTool.name,
  };

  const response = await anthropicClient.messages.create({
    model,
    tool_choice: toolChoice,
    tools: [makeRequestTool],
    system: getSystemPrompt(persona),
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.12,
    max_tokens: 2048,
  });



  const {
    content,
  } = response;

  let toolArgs;
  for (const message of content) {
    if (message.type === "tool_use") {
      toolArgs = message.input;
      logger.info("Tool use input:", JSON.stringify(toolArgs, null, 2));
      return toolArgs;
    }
  }

  logger.error("Parsing tool-call response from Anthropic failed. Response content:", JSON.stringify(content, null, 2));
  throw new Error("Could not parse response from Anthropic");
}
