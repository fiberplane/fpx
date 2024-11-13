import type { RoutesMonitor, RoutesResult } from "@fiberplane/source-analysis";
import { zValidator } from "@hono/zod-validator";
import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { USER_PROJECT_ROOT_DIR } from "../../constants.js";
import * as schema from "../../db/schema.js";
import { generateRequestWithAiProvider } from "../../lib/ai/index.js";
import { expandFunction } from "../../lib/expand-function/expand-function.js";
import { getInferenceConfig } from "../../lib/settings/index.js";
import type { Bindings, Variables } from "../../lib/types.js";
import logger from "../../logger.js";

// Getter function for results, this is overwritten in setupCodeAnalysis
let getResult = async (): Promise<RoutesResult> => {
  return Promise.reject(new Error("Routes not yet parsed"));
};

export function setupCodeAnalysis(monitor: RoutesMonitor) {
  let pending: Promise<void> | null = null;

  // Actual implementation of the getResult function
  getResult = async () => {
    // The result uses a promise/race pattern to wait a certain amount of time for the analysis to complete
    // or use the last known result if it's available

    // Wait for the pending promise to resolve (or timeout)
    await Promise.race([pending, new Promise((r) => setTimeout(r, 100))]);

    // If there's no result and there's a pending promise, wait for it to resolve
    if (!monitor.lastSuccessfulResult && pending) {
      await pending;
    }

    // If there's a result? return it
    if (monitor.lastSuccessfulResult) {
      return monitor.lastSuccessfulResult;
    }

    // Otherwise wait for the next analysis to complete
    if (pending) {
      await pending;
    }

    // If there's a result? return it
    if (monitor.lastSuccessfulResult) {
      return monitor.lastSuccessfulResult;
    }

    throw new Error("Failed to get routes");
  };

  // Add a listener to start the analysis
  monitor.addListener("analysisStarted", () => {
    // If there's a pending promise, create a new promise that resolves when the analysis is complete
    const current = new Promise<void>((resolve) => {
      const completedHandler = () => {
        // Check if this promise is still the current one
        if (pending === current) {
          null;
        }

        monitor.removeListener("analysisCompleted", completedHandler);
        resolve();
      };

      monitor.addListener("analysisCompleted", completedHandler);
    });
    // Set the current promise as the pending promise
    pending = current;
  });

  monitor.start();
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * This route is just here to quickly test the expand-function helper
 */
app.post("/v0/expand-function", cors(), async (ctx) => {
  const { handler } = await ctx.req.json();
  const projectRoot = USER_PROJECT_ROOT_DIR;

  const expandedFunction = await expandFunction(projectRoot, handler);

  return ctx.json({ content: expandedFunction });
});

const generateRequestSchema = z.object({
  handler: z.string(),
  method: z.string(),
  path: z.string(),
  history: z.array(z.string()).nullish(),
  persona: z.string(),
  openApiSpec: z.string().nullish(),
  // middleware: z
  //   .array(
  //     z.object({
  //       handler: z.string(),
  //       method: z.string(),
  //       path: z.string(),
  //     }),
  //   )
  //   .nullish(),
});

app.post(
  "/v0/generate-request",
  cors(),
  zValidator("json", generateRequestSchema),
  async (ctx) => {
    const { handler, method, path, history, persona, openApiSpec } =
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

    const provider = inferenceConfig.aiProvider;

    // Expand out of scope identifiers in the handler function, to add as additional context
    //
    // Uncomment console.time to see how long this takes
    // It should be slow on the first request, but fast-ish on subsequent requests
    //
    // console.time("Handler and Middleware Expansion");
    const [handlerContextPerformant, middlewareContextPerformant] =
      // HACK - Ditch the expand handler for ollama for now, it overwhelms llama 3.1-8b
      provider !== "ollama"
        ? await getResult()
            .then(async (routesResult) => {
              const url = new URL("http://localhost");
              url.pathname = path;
              const request = new Request(url, { method: "GET" });
              routesResult.resetHistory();
              const response = await routesResult.currentApp.fetch(request);
              // console.log("response", response.statusText);
              if ((await response.text()) !== "Ok") {
                console.warn("Failed to fetch route for context expansion");
                return [null, null];
              }
              return [routesResult.getFilesForHistory(), null];
            })
            .catch((error) => {
              // await expandHandler(handler, []).catch((error) => {
              logger.error(`Error expanding handler and middleware: ${error}`);
              return [null, null];
            })
        : [null, null];

    console.log("handlerContextPerformant", handlerContextPerformant);
    // HACK - Get latest token from db
    const [token] = await db
      .select()
      .from(schema.tokens)
      .orderBy(desc(schema.tokens.createdAt))
      .limit(1);

    // Generate the request
    const { data: parsedArgs, error: generateError } =
      await generateRequestWithAiProvider({
        fpApiKey: token?.value,
        inferenceConfig,
        persona,
        method,
        path,
        handler,
        handlerContext: handlerContextPerformant ?? undefined,
        history: history ?? undefined,
        // TODO handle openApiSpec
        openApiSpec: openApiSpec ?? undefined,
        // middleware: middleware ?? undefined,
        middleware: undefined,
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

export default app;
