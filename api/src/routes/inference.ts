import path from "node:path";
import { zValidator } from "@hono/zod-validator";
import chalk from "chalk";
import { Hono } from "hono";
import { cors } from "hono/cors";
import OpenAI from "openai";
import { z } from "zod";
import { USER_PROJECT_ROOT_DIR } from "../constants.js";
import { generateRequestWithAiProvider } from "../lib/ai/index.js";
import { cleanPrompt } from "../lib/ai/prompts.js";
import {
  type ExpandedFunctionContext,
  type ExpandedFunctionResult,
  expandFunction,
} from "../lib/expand-function/index.js";
import { getInferenceConfig } from "../lib/settings/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * This route is just here to quickly test the expand-function helper
 */
app.post("/v0/expand-function", cors(), async (ctx) => {
  const { handler } = await ctx.req.json();
  const expandedFunction = await expandFunctionInUserProject(handler);
  return ctx.json({ expandedFunction });
});

const generateRequestSchema = z.object({
  handler: z.string(),
  method: z.string(),
  path: z.string(),
  history: z.array(z.string()).nullish(),
  persona: z.string(),
  openApiSpec: z.string().nullish(),
  middleware: z
    .array(
      z.object({
        handler: z.string(),
        method: z.string(),
        path: z.string(),
      }),
    )
    .nullish(),
});

app.post(
  "/v0/generate-request",
  cors(),
  zValidator("json", generateRequestSchema),
  async (ctx) => {
    const { handler, method, path, history, persona, openApiSpec, middleware } =
      ctx.req.valid("json");

    const db = ctx.get("db");
    const inferenceConfig = await getInferenceConfig(db);

    if (!inferenceConfig) {
      return ctx.json(
        {
          message: "No inference configuration found",
        },
        403,
      );
    }

    // Expand out of scope identifiers in the handler function, to add as additional context
    console.time("buildAiContext");
    const [handlerContext, middlewareContext] = await buildAiContext(
      handler,
      middleware,
    );
    console.timeEnd("buildAiContext");
    // Generate the request
    const { data: parsedArgs, error: generateError } =
      await generateRequestWithAiProvider({
        inferenceConfig,
        persona,
        method,
        path,
        handler,
        handlerContext,
        history: history ?? undefined,
        openApiSpec: openApiSpec ?? undefined,
        middleware: middleware ?? undefined,
        middlewareContext: middlewareContext ?? undefined,
      });

    if (generateError) {
      return ctx.json({ message: generateError.message }, 500);
    }

    return ctx.json({
      request: parsedArgs,
    });
  },
);

app.post(
  "/v0/analyze-error",
  cors(),
  zValidator(
    "json",
    z.object({ errorMessage: z.string(), handlerSourceCode: z.string() }),
  ),
  async (ctx) => {
    const { handlerSourceCode, errorMessage } = ctx.req.valid("json");

    const db = ctx.get("db");
    const inferenceConfig = await getInferenceConfig(db);
    if (!inferenceConfig) {
      return ctx.json(
        {
          error: "No OpenAI configuration found",
        },
        403,
      );
    }
    const { openaiApiKey, openaiModel } = inferenceConfig;
    const openaiClient = new OpenAI({
      apiKey: openaiApiKey,
    });
    const response = await openaiClient.chat.completions.create({
      model: openaiModel ?? "gpt-4o", // TODO - Update this to use correct model and provider (later problem)
      messages: [
        {
          role: "system",
          content: cleanPrompt(`
            You are a code debugging assistant for apps that use Hono (web framework),
            Neon (serverless postgres), Drizzle (ORM), and run on Cloudflare workers.
            You are given a function and an error message.
            Provide a succinct suggestion to fix the error, or say "I need more context to help fix this".
          `),
        },
        {
          role: "user",
          content: cleanPrompt(`
            I hit the following error:
            ${errorMessage}
            This error originated in the following route handler for my Hono application:
            ${handlerSourceCode}
          `),
        },
      ],
      temperature: 0,
      max_tokens: 2048,
    });

    const {
      choices: [{ message }],
    } = response;

    return ctx.json({
      suggestion: message.content,
    });
  },
);

export default app;

async function buildAiContext(
  handler: string,
  middleware:
    | Array<{
        handler: string;
      }>
    | undefined
    | null,
) {
  console.time("buildHandlerContext");
  const handlerContextPromise = buildHandlerContext(handler).finally(() => {
    console.timeEnd("buildHandlerContext");
  });

  console.time("buildMiddlewareContext");
  const middlewareContextPromise = middleware
    ? buildMiddlewareContext(middleware).finally(() => {
        console.timeEnd("buildMiddlewareContext");
      })
    : Promise.resolve(undefined);

  return Promise.all([handlerContextPromise, middlewareContextPromise]);
}

async function buildHandlerContext(handler: string) {
  const expandedFunction = await expandFunctionInUserProject(handler);
  return transformExpandedFunction(expandedFunction);
}

/**
 * Expand a handler function's out-of-scope identifiers to help with ai request generation
 *
 * This is a convenience wrapper around expandFunction that assumes the user's project root is the current working directory or FPX_WATCH_DIR
 *
 * @param handler - The stringified version of a handler function
 * @returns The handler function location with certain out-of-scope identifiers expanded
 */
async function expandFunctionInUserProject(handler: string) {
  const projectRoot = USER_PROJECT_ROOT_DIR;

  const truncatedHandler = handler.replace(/\n/g, " ").slice(0, 33);
  logger.debug(
    chalk.dim(
      `Expanding function ${truncatedHandler}... in project root ${projectRoot}`,
    ),
  );

  const expandedFunction = await expandFunction(projectRoot, handler);
  return expandedFunction;
}

/**
 * Transform the expanded function into a string that can be used in the LLM's context.
 *
 * @param expandedFunction - The expanded function context
 * @returns The transformed expanded function context
 */
function transformExpandedFunction(
  expandedFunction: ExpandedFunctionResult | null,
): string | undefined {
  if (!expandedFunction || !expandedFunction.context?.length) {
    return undefined;
  }

  function stringifyContext(
    context: ExpandedFunctionContext,
    depth = 0,
  ): string {
    return context
      .map((entry) => {
        const indent = "  ".repeat(depth);
        const filename = entry.definition?.uri
          ? ` filename="${path.basename(entry.definition.uri)}"`
          : "";
        let result = `${indent}<entry>
${indent}  <name${filename}>${entry.name}</name>`;

        if (entry.definition?.text) {
          result += `
${indent}  <definition>
${indent}    ${entry.definition.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").trim().split("\n").join(`\n${indent}    `)}
${indent}  </definition>`;
        }

        if (entry.package) {
          result += `
${indent}  <package>${entry.package}</package>`;
        }

        if (entry.context && entry.context.length > 0) {
          result += `
${indent}  <context>
${stringifyContext(entry.context, depth + 2)}
${indent}  </context>`;
        }

        result += `
${indent}</entry>`;

        return result;
      })
      .join("\n");
  }

  return `<expanded-function>
${stringifyContext(expandedFunction.context)}
</expanded-function>`;
}

/**
 * Build the middleware context from the middleware functions.
 *
 * Recursively expands middleware functions' out of scope identifiers
 * and transforms them into a string that can be used in the LLM's context.
 *
 * @param middleware - The middleware functions
 * @returns The middleware context
 */
async function buildMiddlewareContext(
  middleware: Array<{
    handler: string;
  }>,
): Promise<string | undefined> {
  if (!middleware || !middleware.length) {
    return undefined;
  }

  // HACK - Ignore reactRenderer middleware, as well as bearerAuth, since it's from a third party library
  // We could also be clever and ignore a bunch of other third party Hono middleware by default to avoid too much work being done here
  const filteredMiddleware = middleware.filter(({ handler }) => {
    if (handler?.startsWith("function reactRenderer")) {
      return false;
    }
    if (handler?.startsWith("async function bearerAuth")) {
      return false;
    }
    return true;
  });

  const expandedMiddleware = await Promise.all(
    filteredMiddleware.map(({ handler }) =>
      expandFunctionInUserProject(handler),
    ),
  );

  return `<middleware>
${expandedMiddleware.map(transformExpandedFunction).join("\n")}
</middleware>`;
}
