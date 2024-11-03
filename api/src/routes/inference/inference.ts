import fs from "node:fs/promises";
import path from "node:path";
import { google } from "@ai-sdk/google";
import { zValidator } from "@hono/zod-validator";
import { type CoreMessage, generateObject } from "ai";
import { desc } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
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
import { getMatchingMiddleware } from "./middleware.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Cache directory for expanded route handlers while testing for hackathon ((will save us time))
const CACHE_DIR = path.join(
  process.cwd(),
  "hackathon-route-handlers-expanded-cache",
);

const PLANNER_SYSTEM_PROMPT = `You are an end-to-end api tester. 

You translate user stories describing a testing flow of a json API into the correct routes to hit for that api.

The user will describe some functionality they want to test for their api. You will receive a list of routes. 

Determine the order in which these routes should be executed.

Populate request data for each route in your plan, according to the request schema.

You will be provided the source code of a route handler for an API route, and you should generate
query parameters, a request body, and headers that will test the request.

Be clever and creative with test data. Avoid just writing things like "test".

For example, if you get a route like \`/users/:id\`, you should return a URL like
\`/users/10\` and a pathParams parameter like this:

{ "path": "/users/10", "pathParams": { "key": ":id", "value": "10" } }

*Remember to keep the colon in the pathParam key!*

If you get a route like \`POST /users/:id\` with a handler like:

\`\`\`ts
async (c) => {
  const token = c.req.headers.get("authorization")?.split(" ")[1]

  const auth = c.get("authService");
  const isAuthorized = await auth.isAuthorized(token)
  if (!isAuthorized) {
    return c.json({ message: "Unauthorized" }, 401)
  }

  const db = c.get("db");

  const id = c.req.param('id');
  const { email } = await c.req.json()

  const user = (await db.update(user).set({ email }).where(eq(user.id, +id)).returning())?.[0];

  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json(user);
}
\`\`\`

You should return a URL like:

\`/users/64\` and a pathParams like:

{ "path": "/users/64", "pathParams": { "key": ":id", "value": "64" } }

and a header like:

{ "headers": { "key": "authorization", "value": "Bearer <jwt>" } }

and a body like:

{ email: "paul@beatles.music" }

with a body type of "json"
`.trim();

const createPlanUserPrompt = (userStory: string, routes: string) =>
  `
User story: ${userStory}

Routes: ${routes}
`.trim();

// NOTE - Gemini does not play nicely with unions
//        So I removed `nullable` from the request schema
const geminiRequestSchema = z.object({
  path: z.string(),
  pathParams: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
  queryParams: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
  body: z.string(),
  bodyType: z.object({
    type: z.enum(["json", "text", "form-data", "file"]),
    isMultipart: z.boolean(),
  }),
  headers: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    }),
  ),
});

// NOTE - We cannot use `.optional` from zod because it does not play nicely with structured output from openai... or gemini
export const geminiPlanSchema = z.object({
  stepByStepReasoning: z.string(),
  executionPlanSteps: z.array(
    z.object({
      routeId: z.number(),
      route: z.object({
        id: z.number(),
        path: z.string(),
        method: z.string(),
      }),
      exampleRequest: geminiRequestSchema.describe(
        "Example request for the route handler",
      ),
    }),
  ),
});

app.get("/v0/google-generative-ai-test", async (ctx) => {
  const userStory = "I want to test CRUD functionality for the goose api";
  const model = google("gemini-1.5-pro-latest");
  try {
    const db = ctx.get("db");
    const expandedRouteHandlers = await getExpandedRouteHandlers(db);

    const result = await generateObject({
      model: model,
      schema: geminiPlanSchema,
      system: PLANNER_SYSTEM_PROMPT,
      prompt: createPlanUserPrompt(
        userStory,
        expandedRouteHandlers
          .map(
            (r) => `Route ${r.routeId}: ${r.method} ${r.path}\n\n${r.context}`,
          )
          .join("\n\n"),
      ),
      temperature: 0.1,
      // messages: []
    });
    const { object } = result;
    return ctx.json({
      expandedRouteHandlers,
      response: object,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return ctx.json({ error: errorMessage }, 500);
  }
});

async function getExpandedRouteHandlers(db: LibSQLDatabase<typeof schema>) {
  const routes = await db.select().from(schema.appRoutes);
  const activeRoutes = routes.filter(
    (r) => r.currentlyRegistered && r.handlerType === "route" && r.handler,
  );
  const routesAndMiddleware = routes.filter(
    (r) => r.currentlyRegistered && !r.path?.startsWith("http"),
  );

  await fs.mkdir(CACHE_DIR, { recursive: true });

  const expandedRouteHandlers: {
    context: string;
    method: string;
    path: string;
    routeId: number;
  }[] = [];

  for (const route of activeRoutes) {
    const cacheFile = path.join(CACHE_DIR, `route-${route.id}.json`);

    try {
      const cached = await fs.readFile(cacheFile, "utf-8");
      const expandedHandler = JSON.parse(cached);
      console.debug(
        `Cache hit for route ${route.id} (${route.method} ${route.path})`,
      );

      if (expandedHandler) {
        expandedRouteHandlers.push(expandedHandler);
        continue;
      }
    } catch (error) {
      console.error(`Error reading cache file ${cacheFile}: ${error}`);
    }

    console.debug(
      `Cache miss for route ${route.id} (${route.method} ${route.path}), expanding...`,
    );
    const middleware = getMatchingMiddleware(
      routes,
      routesAndMiddleware,
      route.path ?? "",
      route.method ?? "",
      "http",
    )?.map((m) => ({ ...m, handler: m.handler ?? "" }));

    const context = await expandHandler(route.handler ?? "", middleware ?? []);

    if (context?.[0]) {
      const expandedHandler = {
        context: JSON.stringify(context, null, 2),
        routeId: route.id,
        method: route.method ?? "",
        path: route.path ?? "",
      };
      expandedRouteHandlers.push(expandedHandler);
      await fs.writeFile(cacheFile, JSON.stringify(expandedHandler));
    }
  }

  return expandedRouteHandlers;
}

app.get("/v0/david", async (ctx) => {
  const db = ctx.get("db");
  const expandedRouteHandlers = await getExpandedRouteHandlers(db);

  return ctx.json({
    routeHandlers: expandedRouteHandlers,
  });
});

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
