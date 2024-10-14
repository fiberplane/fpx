import type { Settings } from "@fiberplane/fpx-types";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "../../db/schema.js";
import { generateRequestWithAnthropic } from "./anthropic.js";
import { generateRequestWithFp } from "./fp.js";
import { generateRequestWithOpenAI } from "./openai.js";

export async function generateRequestWithAiProvider(
  {
    inferenceConfig,
    persona,
    method,
    path,
    handler,
    handlerContext,
    history,
    openApiSpec,
    middleware,
    middlewareContext,
  }: {
    inferenceConfig: Settings;
    persona: string;
    method: string;
    path: string;
    handler: string;
    handlerContext?: string;
    history?: string[];
    openApiSpec?: string;
    middleware?: {
      handler: string;
      method: string;
      path: string;
    }[];
    middlewareContext?: string;
  },
  db?: LibSQLDatabase<typeof schema>,
) {
  const {
    openaiApiKey,
    openaiModel,
    openaiBaseUrl,
    anthropicApiKey,
    anthropicModel,
    anthropicBaseUrl,
    aiProviderType,
  } = inferenceConfig;
  if (aiProviderType === "openai") {
    return generateRequestWithOpenAI({
      apiKey: openaiApiKey ?? "",
      model: openaiModel ?? "",
      baseUrl: openaiBaseUrl,
      persona,
      method,
      path,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
    }).then(
      (parsedArgs) => {
        return { data: parsedArgs, error: null };
      },
      (error) => {
        if (error instanceof Error) {
          return { data: null, error: { message: error.message } };
        }
        return { data: null, error: { message: "Unknown error" } };
      },
    );
  }
  if (aiProviderType === "anthropic") {
    return generateRequestWithAnthropic({
      apiKey: anthropicApiKey ?? "",
      baseUrl: anthropicBaseUrl,
      model: anthropicModel ?? "",
      persona,
      method,
      path,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
    }).then(
      (parsedArgs) => {
        return { data: parsedArgs, error: null };
      },
      (error) => {
        if (error instanceof Error) {
          return { data: null, error: { message: error.message } };
        }
        return { data: null, error: { message: "Unknown error" } };
      },
    );
  }

  if (aiProviderType === "fp") {
    const tokens = await db?.select().from(schema.tokens);
    const token = tokens?.[0].value ?? "";
    // TODO - Verify token first?
    return generateRequestWithFp({
      apiKey: token,
      persona,
      method,
      path,
      handler,
      handlerContext,
      history,
      openApiSpec,
      middleware,
      middlewareContext,
    }).then(
      (parsedArgs) => {
        return { data: parsedArgs, error: null };
      },
      (error) => {
        if (error instanceof Error) {
          return { data: null, error: { message: error.message } };
        }
        return { data: null, error: { message: "Unknown error" } };
      },
    );
  }

  return { data: null, error: { message: "Unknown AI provider" } };
}
