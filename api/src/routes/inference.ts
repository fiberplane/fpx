import * as fs from "node:fs";
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
import { findWranglerCompiledJavascriptDir } from "../lib/expand-function/search-function/index.js";
import {
  type FindSourceFunctionsResult,
  type SourceFunctionResult,
  findSourceFunctions,
} from "../lib/find-source-function/find-source-function.js";
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
    console.time("expandHandlerAndMiddlewarePerformant");
    const [handlerContextPerformant, middlewareContextPerformant] =
      await expandHandlerAndMiddlewarePerformant(handler, middleware ?? []);
    console.timeEnd("expandHandlerAndMiddlewarePerformant");

    // Generate the request
    const { data: parsedArgs, error: generateError } =
      await generateRequestWithAiProvider({
        inferenceConfig,
        persona,
        method,
        path,
        handler,
        handlerContext: handlerContextPerformant ?? undefined,
        history: history ?? undefined,
        openApiSpec: openApiSpec ?? undefined,
        middleware: middleware ?? undefined,
        middlewareContext: middlewareContextPerformant ?? undefined,
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

async function expandHandlerAndMiddlewarePerformant(
  handler: string,
  middleware: Array<{ handler: string }>,
) {
  // TODO - Implement this
  // 1. Batch all handler and middleware lookups
  // 2. Return a map of the function text to node and source file locations
  // 3. Run expansion on each function
  // 4. Return the results

  const projectPath = USER_PROJECT_ROOT_DIR;
  const compiledJavascriptPath = findWranglerCompiledJavascriptDir(projectPath);
  if (!compiledJavascriptPath) {
    return [null, null];
  }

  // NOTE - This is a bit of an optimization. We're reading the file contents into memory
  // before passing them to findSourceFunction. This allows us to avoid a multiple reads
  // of the files in findSourceFunction.
  const jsFilePath = path.join(compiledJavascriptPath, "index.js");
  const mapFile = `${jsFilePath}.map`;
  const sourceMapContent = JSON.parse(
    await fs.promises.readFile(mapFile, { encoding: "utf8" }),
  );
  const jsFileContents = await fs.promises.readFile(jsFilePath, {
    encoding: "utf8",
  });

  const filteredMiddleware = filterHonoMiddleware(middleware);

  const functionDefinitions = [
    handler,
    ...filteredMiddleware.map(({ handler }) => handler),
  ];

  const sourceFunctions = await findSourceFunctions(
    jsFileContents,
    functionDefinitions,
    true,
    {
      sourceMapContent,
      jsFileContents,
    },
  );

  const handlerSourceFunction =
    sourceFunctions.find(
      (sourceFunction) => sourceFunction.functionText === handler,
    ) ?? null;

  const middlewareSourceFunctions = sourceFunctions.filter((sourceFunction) =>
    filteredMiddleware.some(
      // @ts-ignore - I will fix this later...
      (middleware) => middleware.handler === sourceFunction.functionText,
    ),
  );

  // TODO - Expand context...
  return buildAiContextPerformant(
    handlerSourceFunction,
    middlewareSourceFunctions,
  );
}

async function buildAiContextPerformant(
  handler: SourceFunctionResult | null,
  middleware: FindSourceFunctionsResult,
) {
  console.time("buildHandlerContextPerformant");
  const handlerContextPromise = handler
    ? buildHandlerContextPerformant(handler).finally(() => {
        console.timeEnd("buildHandlerContextPerformant");
      })
    : Promise.resolve(undefined).then(() => {
        console.timeEnd("buildHandlerContextPerformant");
      });

  console.time("buildMiddlewareContextPerformant");
  const middlewareContextPromise = middleware
    ? buildMiddlewareContextPerformant(middleware).finally(() => {
        console.timeEnd("buildMiddlewareContextPerformant");
      })
    : Promise.resolve(undefined).finally(() => {
        console.timeEnd("buildMiddlewareContextPerformant");
      });

  return Promise.all([handlerContextPromise, middlewareContextPromise]);
}

async function buildHandlerContextPerformant(handler: SourceFunctionResult) {
  if (handler?.sourceFunction) {
    const expandedFunction = await expandFunctionInUserProject(handler);
    return transformExpandedFunction(expandedFunction);
  }
  return undefined;
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
async function buildMiddlewareContextPerformant(
  middleware: FindSourceFunctionsResult,
): Promise<string | undefined> {
  if (!middleware || !middleware.length) {
    return undefined;
  }

  const expandedMiddleware = await Promise.all(
    middleware.map((m) => {
      return expandFunctionInUserProject(m);
    }),
  );

  return `<middleware>
${expandedMiddleware.map(transformExpandedFunction).join("\n")}
</middleware>`;
}

/**
 * Expand a handler function's out-of-scope identifiers to help with ai request generation
 *
 * This is a convenience wrapper around expandFunction that assumes the user's project root is the current working directory or FPX_WATCH_DIR
 *
 * @param handler - The result of mapping the handler function back to the original source code
 * @returns The handler function location with certain out-of-scope identifiers expanded
 */
async function expandFunctionInUserProject(handler: SourceFunctionResult) {
  const projectRoot = USER_PROJECT_ROOT_DIR;
  const functionText = handler.functionText;
  const truncatedHandler = functionText.replace(/\n/g, " ").slice(0, 33);
  logger.debug(
    chalk.dim(
      `Expanding function ${truncatedHandler}... in project root ${projectRoot}`,
    ),
  );

  const hints = {
    sourceFunction: handler.sourceFunction,
    sourceFile: handler.source,
  };

  const expandedFunction = await expandFunction(projectRoot, functionText, {
    skipSourceMap: true,
    hints,
  });

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

// HACK - Ignore reactRenderer middleware, as well as bearerAuth, since it's from a third party library
//        We could also be clever and ignore a bunch of other third party Hono middleware by default to avoid too much work being done here
function filterHonoMiddleware(middleware: Array<{ handler: string }>) {
  return middleware.filter((m) => {
    const functionText = m.handler;
    return (
      !functionText.startsWith("function reactRenderer") &&
      !functionText.startsWith("async function bearerAuth")
    );
  });
}
