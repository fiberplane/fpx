import chalk from "chalk";
import OpenAI from "openai";
import logger from "../../logger.js";
import { isJson } from "../utils.js";
import { getSystemPrompt, invokeRequestGenerationPrompt } from "./prompts.js";
import { makeRequestTool } from "./tools.js";

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
    `handler: ${handler}`,
    // `handlerContext: ${handlerContext}`,
    // `openApiSpec: ${openApiSpec}`,
    // `middleware: ${middleware}`,
    // `middlewareContext: ${middlewareContext}`,
  );
  // Remove trailing slash from baseUrl
  let openaiCompatibleBaseUrl = baseUrl.replace(/\/$/, "");
  openaiCompatibleBaseUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;

  const openaiClient = new OpenAI({ apiKey, baseURL: openaiCompatibleBaseUrl });
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
    // NOTE - llama-3.1-8b is not very good at function calling, but the 70b and 405b variants were pre-trained to be good at it.
    //        Don't expect a lot from this :grimace:
    model,
    // NOTE - We can try to restrict the response to be from this single tool call
    tool_choice: {
      type: "function",
      function: { name: makeRequestTool.function.name },
    },
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

  logger.debug(
    "ollama message from response:",
    JSON.stringify(message, null, 2),
  );

  const makeRequestCall = message.tool_calls?.[0];
  const toolArgs = makeRequestCall?.function?.arguments;

  logger.debug("ollama toolArgs", JSON.stringify(toolArgs, null, 2));

  // HACK - llama 3.1 (8B) might get confused and just respond with JSON describing the tool call.
  //        So we should try to parse the content as a tool call
  //        ((this does not really work as a fallback yet, but usually the json is malformed anyhow))
  if (!toolArgs) {
    logger.warn(
      chalk.red(
        "ollama tool call arguments not found, trying to parse message content as tool call",
      ),
    );
    logger.debug("ollama message content", message?.content);
    const parsedContent = isJson(message?.content)
      ? JSON.parse(message?.content ?? "")
      : null;
    logger.debug("ollama parsedContent", parsedContent);
    // TODO - Validate the parsed content as a tool call, this object could take a couple of different shapes
    return parsedContent;
  }

  try {
    const parsedArgs = toolArgs ? JSON.parse(toolArgs) : null;
    // HACK - llama 3.1 does not deal well with nested json objects, and will return each property as its stringified value.
    //        We should try to parse the values that look like json strings.
    if (parsedArgs) {
      for (const key in parsedArgs) {
        // We do not want to json parse the body field - it should be a string
        if (key === "body") {
          continue;
        }

        const value = parsedArgs[key];
        if (typeof value === "string" && isJson(value)) {
          const parsedValue = JSON.parse(value);
          if (key === "headers" && Array.isArray(parsedValue)) {
            // HACK - llama 3.1 will sometimes return the headers like ["Content-Type: application/json"]
            parsedArgs[key] = parsedValue.map((header: unknown) => {
              if (typeof header === "string" && header.includes(":")) {
                const [key, value] = header.split(": ");
                return { key, value };
              }
              return header;
            });
          } else {
            parsedArgs[key] = parsedValue;
          }
        }
      }
    }
    return parsedArgs;
  } catch (error) {
    logger.error("Parsing tool-call response from Ollama failed:", error);
    throw new Error("Could not parse response from Ollama");
  }
}
