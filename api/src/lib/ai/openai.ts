import OpenAI from "openai";
import logger from "../../logger.js";
import {
  FRIENDLY_PARAMETER_GENERATION_SYSTEM_PROMPT,
  QA_PARAMETER_GENERATION_SYSTEM_PROMPT,
  friendlyTesterPrompt,
  qaTesterPrompt,
} from "./prompts.js";

const makeRequestTool = {
  type: "function" as const,
  function: {
    name: "make_request",
    description:
      "Generates some random data for an http request to an api backend",
    // Describe parameters as json schema https://json-schema.org/understanding-json-schema/
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
        },
        pathParams: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
        queryParams: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
        body: {
          type: "string",
        },
        headers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              key: {
                type: "string",
              },
              value: {
                type: "string",
              },
            },
          },
        },
      },
      // TODO - Mark fields like `pathParams` as required based on the route definition?
      required: ["path"],
    },
  },
};

type GenerateRequestOptions = {
  apiKey: string;
  model: string;
  persona: string;
  method: string;
  path: string;
  handler: string;
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
  model,
  persona,
  method,
  path,
  handler,
  history,
}: GenerateRequestOptions) {
  const openaiClient = new OpenAI({ apiKey });
  const promptTemplate =
    persona === "QA" ? qaTesterPrompt : friendlyTesterPrompt;
  const userPromptInterface = await promptTemplate.invoke({
    method,
    path,
    handler,
    history: history?.join("\n") ?? "NO HISTORY",
  });
  const userPrompt = userPromptInterface.value;

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
        content:
          persona === "QA"
            ? QA_PARAMETER_GENERATION_SYSTEM_PROMPT
            : FRIENDLY_PARAMETER_GENERATION_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.12,
    max_tokens: 4096,
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
