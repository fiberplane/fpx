import OpenAI from "openai";
import logger from "../../logger.js";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts.js";
import { makeRequestTool } from "./tools.js";
import { isJson } from "../utils.js";

type GenerateRequestOptions = {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  persona: string;
  method: string;
  path: string;
  handler: string;
  handlerContext?: string;
  history?: Array<string>;
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
 * - uses OpenAI's tool-calling feature.
 * - returns the request data as JSON.
 *
 * See the JSON Schema definition for the request data in the `make_request` tool.
 */
export async function generateRequestWithOllama({
  // NOTE - Ollama does not require an API key
  apiKey = "ollama",
  baseUrl = "http://localhost:11434",
  model = "llama3.1",
  persona,
  method,
  path,
  handler,
  handlerContext,
  history,
  openApiSpec,
  middleware,
  middlewareContext,
}: GenerateRequestOptions & {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}) {
  logger.debug(
    "Generating request data with Ollama",
    `model: ${model}`,
    `baseUrl: ${baseUrl}`,
    `persona: ${persona}`,
    `method: ${method}`,
    `path: ${path}`,
    // `handler: ${handler}`,
    // `handlerContext: ${handlerContext}`,
    // `openApiSpec: ${openApiSpec}`,
    // `middleware: ${middleware}`,
    // `middlewareContext: ${middlewareContext}`,
  );
  // Remove trailing slash from baseUrl
  let openaiCompatibleBaseUrl = baseUrl.replace(/\/$/, "");
  openaiCompatibleBaseUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;
  const patchedFetch = (...args: any) => {
    console.log("fetch args", args);
    return fetch(...args);
  };
  const openaiClient = new OpenAI({ apiKey, baseURL: openaiCompatibleBaseUrl, fetch: patchedFetch });
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
        content: getSystemPrompt(persona, "ollama"),
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    temperature: 0.04,
    max_tokens: 2048,
  });

  const {
    choices: [{ message }],
  } = response;

  console.log("ollama initial message", message);

  const makeRequestCall = message.tool_calls?.[0];
  const toolArgs = makeRequestCall?.function?.arguments;

  console.log("ollama toolArgs", toolArgs);


  // HACK - The model might get confused and just respond with JSON describing the tool call.
  //        So we should try to parse the content as a tool call
  if (!toolArgs) {
    console.log("ollama message content", message?.content);
    const parsedContent = isJson(message?.content) ? JSON.parse(message?.content ?? "") : null;
    console.log("ollama parsedContent", parsedContent);
    // TODO - Validate the parsed content as a tool call, this object could take a couple of different shapes
    return parsedContent;
  }

  try {
    const parsedArgs = toolArgs ? JSON.parse(toolArgs) : null;
    // HACK - Ollama does not deal well with nested json objects, and will return each property as its stringified value.
    //        We should try to parse the values that look like json strings.
    if (parsedArgs) {
      for (const key in parsedArgs) {
        const value = parsedArgs[key];
        if (typeof value === "string" && isJson(value)) {
          parsedArgs[key] = JSON.parse(value);
        }
      }
    }
    return parsedArgs;
  } catch (error) {
    logger.error("Parsing tool-call response from Ollama failed:", error);
    throw new Error("Could not parse response from Ollama");
  }
}
