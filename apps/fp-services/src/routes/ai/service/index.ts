import type { GenerateRequestOptions } from "../types";
import { generateRequestWithOpenAI } from "./openai";

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
  prompt,
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
    prompt,
  }).catch((error) => {
    if (error instanceof Error) {
      return { data: null, error: { message: error.message } };
    }
    return { data: null, error: { message: "Unknown error" } };
  });
}
