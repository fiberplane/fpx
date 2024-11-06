import {
  AppFactory,
  analyze,
  type setupMonitoring,
} from "@fiberplane/source-analysis";
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

type Result = ReturnType<typeof setupMonitoring>;

let pending = false;
// This can contain a reference to the resolve function of the initial appFactoryPromise
let initialResolve: ((value: AppFactory) => void) | null;
// This promise will resolve to the AppFactory once the routes have been parsed
let appFactoryPromise: Promise<AppFactory> = new Promise((resolve) => {
  initialResolve = resolve;
});

function debounce<T extends (...args: Array<unknown>) => void | Promise<void>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export function setupCodeAnalysis({
  findHonoRoutes,
  watcher,
}: Pick<Result, "watcher" | "findHonoRoutes">) {
  const rawParseRoutes = () => {
    if (pending) {
      // Already busy
      return;
    }
    pending = true;
    appFactoryPromise = Promise.resolve().then(() => {
      const result = findHonoRoutes();
      const root = analyze(result.resourceManager.getResources());
      if (!root) {
        pending = false;
        // Todo: better handle errors like this
        // we should (probably) display a message to the user
        throw new Error("No root node found");
      }

      const factory = new AppFactory(result.resourceManager);
      factory.setRootTree(root.id);

      pending = false;

      // Also resolve the initial promise
      if (initialResolve) {
        initialResolve(factory);
        initialResolve = null;
      }
      return factory;
    });
  };

  const parseRoutes = debounce(rawParseRoutes, 10);

  rawParseRoutes();
  console.log("setting up event listeners");
  watcher.on("fileAdded", parseRoutes);
  watcher.on("fileUpdated", parseRoutes);
  watcher.on("fileRemoved", parseRoutes);
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
    const {
      handler,
      method,
      path,
      history,
      persona,
      openApiSpec,
      //  middleware
    } = ctx.req.valid("json");

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
        ? // ? await expandHandler(handler, middleware ?? []).catch((error) => {
        await appFactoryPromise
          .then(async (factory) => {
            const url = new URL("http://localhost");
            url.pathname = path;
            const request = new Request(url, { method: "GET" });
            const app = factory.currentApp;
            factory.resetHistory();
            const response = await app.fetch(request);
            console.log("response", response.statusText);
            return [factory.getFilesForHistory(), null];
          })
          .catch((error) => {
            // await expandHandler(handler, []).catch((error) => {
            logger.error(`Error expanding handler and middleware: ${error}`);
            return [null, null];
          })
        : [null, null];
    // console.timeEnd("Handler and Middleware Expansion");
    console.log("-----");
    console.log("handlerContextPerformant", handlerContextPerformant);
    // throw new Error('not implemented');
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
