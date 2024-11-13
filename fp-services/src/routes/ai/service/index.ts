import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { GenerateRequestOptions } from "../types";
import { generateRequestWithOpenAI } from "./openai";
import { invokeCommandsPrompt } from "./prompts";

const commandsSchema = z.object({
  // we use the routeId so that the LLMs know to reference that
  commands: z.array(
    z.object({
      routeId: z.number(),
    }),
  ),
});

export async function translateCommands({
  apiKey,
  commands,
}: {
  apiKey: string;
  commands: string;
}) {
  const openaiClient = createOpenAI({
    apiKey,
  });
  return generateObject({
    model: openaiClient("gpt-4o"),
    schema: commandsSchema,
    prompt: await invokeCommandsPrompt({ commands }),
  })
    .then((result) => {
      const { object: translatedCommands, usage, warnings } = result;
      console.debug("Generated object, warnings, usage", {
        translatedCommands,
        warnings,
        usage,
      });
      return { data: translatedCommands, error: null };
    })
    .catch((error) => {
      if (error instanceof Error) {
        return { data: null, error: { message: error.message } };
      }
      return { data: null, error: { message: "Unknown error" } };
    });
}

export async function generateRequest({
  apiKey,
  persona,
  method,
  path,
  handler,
  handlerContext,
  history,
  openApiSpec,
  middleware,
  middlewareContext,
}: GenerateRequestOptions & { apiKey: string }) {
  return generateRequestWithOpenAI({
    apiKey,
    model: "gpt-4o",
    persona,
    method,
    path,
    handler,
    handlerContext,
    history,
    openApiSpec,
    middleware,
    middlewareContext,
  }).catch((error) => {
    if (error instanceof Error) {
      return { data: null, error: { message: error.message } };
    }
    return { data: null, error: { message: "Unknown error" } };
  });
}
