import { zValidator } from "@hono/zod-validator";
import type { CoreMessage } from "ai";
import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { USER_PROJECT_ROOT_DIR } from "../../constants.js";
import * as schema from "../../db/schema.js";
import {
  generateRequestWithAiProvider,
  translateCommands,
} from "../../lib/ai/index.js";
import { expandFunction } from "../../lib/expand-function/index.js";
import { getInferenceConfig } from "../../lib/settings/index.js";
import type { Bindings, Variables } from "../../lib/types.js";
import logger from "../../logger.js";
import { expandHandler } from "./expand-handler.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * This route is just here to quickly test the expand-function helper
 */
app.post("/v0/expand-function", cors(), async (ctx) => {
  const { handler } = await ctx.req.json();
  const projectRoot = USER_PROJECT_ROOT_DIR;

  const expandedFunction = await expandFunction(projectRoot, handler);
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
        ? await expandHandler(handler, middleware ?? []).catch((error) => {
            logger.error(`Error expanding handler and middleware: ${error}`);
            return [null, null];
          })
        : [null, null];
    // console.timeEnd("Handler and Middleware Expansion");

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

/**
 * Schema for the create plan request
 *
 * When you send this along, you will want
 */
const CreatePlanSchema = z.object({
  prompt: z.string().describe("The prompt to use for the plan creation"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .describe(
      "The history of messages between the user and the AI, in ascending order (oldest messages first)",
    ),
});

app.post(
  "/v0/create-plan",
  cors(),
  zValidator("json", CreatePlanSchema),
  async (ctx) => {
    const createPlanPayload: {
      prompt: string;
      messages?: CoreMessage[];
    } = ctx.req.valid("json");

    const { prompt, messages } = createPlanPayload;

    // hack - linter
    console.log(prompt, messages);

    // TODO: do the actual plan creation - for now just hardcode a plan
    const plan = [
      {
        routeId: 1,
        route: {
          id: 1,
          path: "/api/geese",
          method: "POST",
        },
        payload: {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: {
            name: "Grace Gooseper",
            isFlockLeader: true,
            programmingLanguage: "COBOL",
            motivations: {
              primary: "Making computing accessible to everyone",
              secondary: "Honking at bugs until they go away",
            },
            location: "Pond Valley Tech Campus",
          },
        },
      },
      {
        routeId: 2,
        route: {
          id: 2,
          path: "/api/geese/:id/bio",
          method: "POST",
        },
        payload: {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          pathParameters: {
            id: "1",
          },
        },
      },
      {
        routeId: 3,
        route: {
          id: 3,
          path: "/api/geese/:id/generate",
          method: "POST",
        },
        payload: {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          pathParameters: {
            id: "1",
          },
        },
      },
      {
        routeId: 4,
        route: {
          id: 4,
          path: "/api/geese/:id/honk",
          method: "POST",
        },
        payload: {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          pathParameters: {
            id: "1",
          },
        },
      },
    ];

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return ctx.json(plan);
  },
);

app.post("/v0/translate-commands", cors(), async (ctx) => {
  const commands = await ctx.req.text();

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

  // HACK - Get latest token from db
  const [fpToken] =
    inferenceConfig.aiProvider === "fp"
      ? await db
          .select()
          .from(schema.tokens)
          .orderBy(desc(schema.tokens.createdAt))
          .limit(1)
      : [null];

  const { data: translatedCommands, error: translateError } =
    await translateCommands({
      fpApiKey: fpToken?.value,
      inferenceConfig,
      commands,
    });

  if (translateError) {
    return ctx.json({ message: translateError.message }, 500);
  }

  return ctx.json(translatedCommands);
});

export default app;
