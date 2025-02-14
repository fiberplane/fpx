import { zValidator } from "@hono/zod-validator";
import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import * as schema from "../../db/schema.js";
import { generateRequestWithAiProvider } from "../../lib/ai/index.js";
import { getResult } from "../../lib/code-analysis.js";
import { getInferenceConfig } from "../../lib/settings/index.js";
import type { Bindings, Variables } from "../../lib/types.js";
import logger from "../../logger/index.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const generateRequestSchema = z.object({
  handler: z.string(),
  method: z.string(),
  path: z.string(),
  history: z.array(z.string()).nullish(),
  persona: z.string(),
  openApiSpec: z.string().nullish(),
  prompt: z.string().nullish(),
});

app.post(
  "/v0/generate-request",
  cors(),
  zValidator("json", generateRequestSchema),
  async (ctx) => {
    const { handler, method, path, history, persona, openApiSpec, prompt } =
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
    const [handlerContextPerformant, middlewareContextPerformant] =
      // HACK - Ditch the expand handler for ollama for now, it overwhelms llama 3.1-8b
      provider !== "ollama"
        ? await getResult()
            .then(async (routesResult) => {
              if (!routesResult) {
                return [null, null];
              }

              const url = new URL("http://localhost");
              url.pathname = path;
              const request = new Request(url, { method });
              routesResult.resetHistory();
              const response = await routesResult.currentApp.fetch(request);
              const responseText = await response.text();
              if (responseText !== "Ok") {
                logger.warn(
                  "Failed to fetch route for context expansion",
                  responseText,
                );
                return [null, null];
              }
              return [routesResult.getFilesForHistory(), null];
            })
            .catch((error) => {
              logger.error(`Error expanding handler and middleware: ${error}`);
              return [null, null];
            })
        : [null, null];

    // HACK - Get latest token from db
    const [token] = await db
      .select()
      .from(schema.tokens)
      .orderBy(desc(schema.tokens.createdAt))
      .limit(1);

    // Generate the request
    const generateRequestOptions = {
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
      // additional user prompt (from studio)
      prompt: prompt ?? undefined,
    };

    const { data: parsedArgs, error: generateError } =
      await generateRequestWithAiProvider(generateRequestOptions);

    // Log the request data for future inspection
    await db.insert(schema.aiRequestLogs).values({
      log: JSON.stringify(generateRequestOptions),
    });

    if (generateError) {
      return ctx.json({ message: generateError.message }, 500);
    }

    return ctx.json({
      request: parsedArgs,
    });
  },
);

app.get("/v0/ai-request-logs", cors(), async (ctx) => {
  const db = ctx.get("db");

  // Fetch the last 100 aiRequestLogs from the database
  const logs = await db
    .select()
    .from(schema.aiRequestLogs)
    .orderBy(desc(schema.aiRequestLogs.createdAt))
    .limit(100);

  return ctx.json(logs);
});

export default app;
