import type { OtelTrace, Settings } from "@fiberplane/fpx-types";
import {
  generateDiffWithCreatedTestAnthropic,
  generateRequestWithAnthropic,
} from "./anthropic.js";
import {
  generateDiffWithCreatedTestOpenAI,
  generateRequestWithOpenAI,
} from "./openai.js";
import { type FileType, GitDiffSchema } from "./schema.js";

export async function generateRequestWithAiProvider({
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
}) {
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

  return { data: null, error: { message: "Unknown AI provider" } };
}

export async function generateDiffWithCreatedTest({
  inferenceConfig,
  trace,
  relevantFiles,
}: {
  inferenceConfig: Settings;
  trace: OtelTrace;
  relevantFiles: FileType[];
}) {
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
    return generateDiffWithCreatedTestOpenAI({
      apiKey: openaiApiKey ?? "",
      model: openaiModel ?? "",
      baseUrl: openaiBaseUrl,
      trace,
      relevantFiles,
    }).then(
      (generatedDiff) => {
        return { data: generatedDiff, error: null };
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
    return generateDiffWithCreatedTestAnthropic({
      apiKey: anthropicApiKey ?? "",
      baseUrl: anthropicBaseUrl,
      model: anthropicModel ?? "",
      trace,
      relevantFiles,
    }).then(
      (generatedDiff) => {
        try {
          const diff = GitDiffSchema.parse(generatedDiff);
          return { data: diff, error: null };
        } catch (error) {
          return {
            data: null,
            error: { message: `Could not parse diff: ${error}` },
          };
        }
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
