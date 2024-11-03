import { google } from "@ai-sdk/google";
import { zValidator } from "@hono/zod-validator";
import { type CoreMessage, generateObject, jsonSchema, streamObject } from "ai";
import { desc } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { cors } from "hono/cors";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { USER_PROJECT_ROOT_DIR } from "../../constants.js";
import * as schema from "../../db/schema.js";
import {
  generateRequestWithAiProvider,
  translateCommands,
} from "../../lib/ai/index.js";
import { STEP_EVALUATION_SYSTEM_PROMPT } from "../../lib/ai/prompts.js";
import { expandFunction } from "../../lib/expand-function/index.js";
import { getInferenceConfig } from "../../lib/settings/index.js";
import type { Bindings, Variables } from "../../lib/types.js";
import logger from "../../logger.js";
import { expandHandler } from "./expand-handler.js";
import { getMatchingMiddleware } from "./middleware.js";
import { GENERATE_FLOW_PLAN_SYSTEM_PROMPT } from "../../lib/ai/prompts.js";

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
  body: z.string().nullable(),
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

const PlanStepSchema = z.object({
  routeId: z.number(),
  route: z.object({
    id: z.number(),
    path: z.string(),
    method: z.string(),
  }),
  exampleRequest: geminiRequestSchema.describe(
    "Example request for the route handler",
  ),
});

// NOTE - We cannot use `.optional` from zod because it does not play nicely with structured output from openai... or gemini
const geminiPlanSchema = z.object({
  stepByStepReasoning: z.string(),
  executionPlanSteps: z.array(PlanStepSchema),
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
    (r) =>
      r.method !== "ALL" &&
      r.currentlyRegistered &&
      r.handlerType === "route" &&
      r.handler,
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

const NextStepSchema = z.object({
  plan: z.object({
    description: z.string(),
    steps: z.array(PlanStepSchema),
  }),
  currentStepIdx: z.number(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
  previousResults: z
    .array(
      z.object({
        // todo
        status: z.string(),
      }),
    )
    .nullable(),
});

const EvaluateNextStepAiResponseSchema = z.object({
  action: z.enum(["execute", "awaitInput"]),
  message: z.string().describe("A message to the user about the next step"),
  modifiedStep: PlanStepSchema,
});

const createStepEvaluationUserPrompt = () => {
  return `TODO`;
};

app.post(
  "/v0/evaluate-next-step",
  cors(),
  zValidator("json", NextStepSchema),
  async (ctx) => {
    const { plan, currentStepIdx, messages: history } = ctx.req.valid("json");
    const currentStep = plan.steps[currentStepIdx];
    if (!currentStep) {
      return ctx.json({ error: "Current step not found" }, 400);
    }

    const model = google("gemini-1.5-pro-latest");

    const messages = [
      ...(history ?? []),
      { role: "user" as const, content: createStepEvaluationUserPrompt() },
    ];

    const aiResponse = await generateObject({
      model,
      schema: EvaluateNextStepAiResponseSchema,
      system: STEP_EVALUATION_SYSTEM_PROMPT,
      temperature: 0.1,
      messages,
    });

    return ctx.json({
      action: aiResponse.object.action,
      message: aiResponse.object.message,
      modifiedStep: aiResponse.object.modifiedStep,
    });
  },
);

app.post(
  "/v0/create-plan",
  cors(),
  zValidator("json", CreatePlanSchema),
  async (ctx) => {
    const USE_MOCK_DATA = true;
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 1600));
      return ctx.json(getMockCreatePlanResponse());
    }

    const { prompt: userStory, messages: history } = ctx.req.valid("json");
    const model = google("gemini-1.5-pro-latest");
    try {
      const db = ctx.get("db");
      const expandedRouteHandlers = await getExpandedRouteHandlers(db);

      const userPrompt = createPlanUserPrompt(
        userStory,
        expandedRouteHandlers
          .map(
            (r) => `Route ${r.routeId}: ${r.method} ${r.path}\n\n${r.context}`,
          )
          .join("\n\n"),
      );

      const messages = [
        ...(history ?? []),
        {
          role: "user" as const,
          content: userPrompt,
        },
      ];
      console.time("Create Plan Gemini call");
      const result = await generateObject({
        model: model,
        schema: geminiPlanSchema,
        system: PLANNER_SYSTEM_PROMPT,
        temperature: 0.1,
        messages,
      });
      console.timeEnd("Create Plan Gemini call");
      const { object } = result;
      const plan = object.executionPlanSteps.map(transformPlanStep);
      return ctx.json({
        description: object.stepByStepReasoning,
        plan,
        // expandedRouteHandlers,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return ctx.json({ error: errorMessage }, 500);
    }
  },
);

function safeParseJson(input: string | null | undefined) {
  if (!input) {
    return null;
  }

  try {
    return JSON.parse(input);
  } catch (_error) {
    logger.error("This is not valid JSON:", input);
    return input;
  }
}

function transformPlanStep(
  step: z.infer<typeof geminiPlanSchema>["executionPlanSteps"][number],
) {
  // Convert arrays of key-value pairs into objects
  const headers = step.exampleRequest.headers.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const pathParams = step.exampleRequest.pathParams.reduce(
    (acc, { key, value }) => {
      acc[key.replace(":", "")] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const queryParams = step.exampleRequest.queryParams.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  const cutePayload = {
    headers,
    pathParameters: Object.keys(pathParams).length > 0 ? pathParams : undefined,
    queryParameters:
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
    // HACK - Only try to parse the body as JSON if the bodyType is "json"
    body: step.exampleRequest.body
      ? step.exampleRequest.bodyType.type === "json"
        ? // NOTE - The safeParse here will return the input as-is if it is not valid JSON
        //        This is to support things like form bodies
        safeParseJson(step.exampleRequest.body)
        : step.exampleRequest.body
      : undefined,
    bodyType: step.exampleRequest.bodyType,
  };

  return {
    routeId: step.route.id,
    route: step.route,
    // Shape of the data expected by the zustand store
    payload: step.exampleRequest,
    // Shape of the data that i saw in the create-plan-mock route
    cutePayload,
  };
}

app.post(
  "/v0/create-plan-mock",
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

    const outputSchema = jsonSchema({//output schema to use for plan generation
      "type": "object",
      "properties": {
        "executionPlan": {
          "type": "array",
          "description": "a list of steps for this execution plan",
          "items": {
            "type": "object",
            "required": [
              "path",
              "verb",
              "parameters",
              "reasoning",
              "expected output"
            ],
            "properties": {
              "path": {
                "type": "string",
                "description": "the path of the api endpoint"
              },
              "verb": {
                "type": "string",
                "description": "the HTTP verb (GET, POST, PUT, DELTE)"
              },
              "parameters": {
                "type": "string",
                "description": "JSON representation of all parameters and values to use. empty object {} if none provided"
              },
              "reasoning": {
                "type": "string",
                "description": "the reason for calling this endpoint at this point in the sequence"
              },
              "expected output": {
                "type": "string",
                "description": "a summary of the expected output for this api call"
              },
              "dependencies": {
                "type": "array",
                "description": "the fully qualified dotpath of the dependencies on other steps in the execution plan",
                "items": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    }
    );

    const realPlan = await generateObject({
      model: google("gemini-1.5-pro-002"),
      schema: outputSchema,
      system: GENERATE_FLOW_PLAN_SYSTEM_PROMPT,
      messages,
      temperature: 0,
      seed: 123,
    });

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

    // await new Promise((resolve) => setTimeout(resolve, 1000));

    return ctx.json({ plan });
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

function getMockCreatePlanResponse() {
  return {
    description:
      "1. **GET /api/geese**: Start by retrieving all geese to understand the current state.\n2. **POST /api/geese**: Create a new goose with sample data.\n3. **GET /api/geese/:id**: Retrieve the newly created goose by ID to verify its creation.\n4. **POST /api/geese/:id/bio**: Update the goose's bio.\n5. **POST /api/geese/:id/generate**: Generate content for the goose.\n6. **POST /api/geese/:id/honk**: Increment the goose's honk count.\n7. **PATCH /api/geese/:id**: Update the goose with a new name.\n8. **PATCH /api/geese/:id/motivations**: Update the goose's motivations.\n9. **POST /api/geese/:id/change-name-url-form**: Change the goose's name and location using URL-encoded form data.\n10. **GET /api/geese/flock-leaders**: Retrieve all flock leaders.\n11. **GET /api/geese/language/:language**: Retrieve geese filtered by programming language.",
    plan: [
      {
        routeId: 3083,
        route: {
          id: 3083,
          path: "/api/geese",
          method: "GET",
        },
        payload: {
          path: "/api/geese",
          pathParams: [],
          queryParams: [],
          body: null,
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3085,
        route: {
          id: 3085,
          path: "/api/geese",
          method: "POST",
        },
        payload: {
          path: "/api/geese",
          pathParams: [],
          queryParams: [],
          body: '{"name":"Honk","isFlockLeader":true,"programmingLanguage":"Python","motivations":{"honking":"loudly","flying":"high"},"location":"Silicon Valley"}',
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          body: {
            name: "Honk",
            isFlockLeader: true,
            programmingLanguage: "Python",
            motivations: {
              honking: "loudly",
              flying: "high",
            },
            location: "Silicon Valley",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3088,
        route: {
          id: 3088,
          path: "/api/geese/:id",
          method: "GET",
        },
        payload: {
          path: "/api/geese/1",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: null,
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3089,
        route: {
          id: 3089,
          path: "/api/geese/:id/bio",
          method: "POST",
        },
        payload: {
          path: "/api/geese/1/bio",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: '{"bio":"A very honky goose."}',
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: {
            bio: "A very honky goose.",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3086,
        route: {
          id: 3086,
          path: "/api/geese/:id/generate",
          method: "POST",
        },
        payload: {
          path: "/api/geese/1/generate",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: null,
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3090,
        route: {
          id: 3090,
          path: "/api/geese/:id/honk",
          method: "POST",
        },
        payload: {
          path: "/api/geese/1/honk",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: null,
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3091,
        route: {
          id: 3091,
          path: "/api/geese/:id",
          method: "PATCH",
        },
        payload: {
          path: "/api/geese/1",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: '{"name":"Honker"}',
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: {
            name: "Honker",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3093,
        route: {
          id: 3093,
          path: "/api/geese/:id/motivations",
          method: "PATCH",
        },
        payload: {
          path: "/api/geese/1/motivations",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: '{"newMotivations":{"swimming":"fast"}}',
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: {
            newMotivations: {
              swimming: "fast",
            },
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3094,
        route: {
          id: 3094,
          path: "/api/geese/:id/change-name-url-form",
          method: "POST",
        },
        payload: {
          path: "/api/geese/1/change-name-url-form",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: "new_name=Goose&new_location=Seattle",
          bodyType: {
            type: "form-data",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: "new_name=Goose&new_location=Seattle",
          bodyType: {
            type: "form-data",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3087,
        route: {
          id: 3087,
          path: "/api/geese/flock-leaders",
          method: "GET",
        },
        payload: {
          path: "/api/geese/flock-leaders",
          pathParams: [],
          queryParams: [],
          body: null,
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3092,
        route: {
          id: 3092,
          path: "/api/geese/language/:language",
          method: "GET",
        },
        payload: {
          path: "/api/geese/language/Python",
          pathParams: [
            {
              key: ":language",
              value: "Python",
            },
          ],
          queryParams: [],
          body: null,
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
        cutePayload: {
          headers: {},
          pathParameters: {
            language: "Python",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
    ],
  };
}

// NOTE - This is the version that uses the "cutePayload" as the payload instead of the format of data expected by the store in the UI
function getMockCreatePlanResponseCute() {
  return {
    description:
      "1. **GET /api/geese**: Start by retrieving all geese to understand the current state of the data.\n2. **POST /api/geese**: Create a new goose with sample data. This will give us an ID to use for subsequent requests.\n3. **GET /api/geese/:id**: Retrieve the newly created goose by ID to verify its creation and data.\n4. **POST /api/geese/:id/bio**: Update the goose's bio.\n5. **POST /api/geese/:id/generate**: Generate content for the goose.\n6. **POST /api/geese/:id/honk**: Increment the goose's honk count.\n7. **PATCH /api/geese/:id**: Update the goose with a new name.\n8. **PATCH /api/geese/:id/motivations**: Update the goose's motivations.\n9. **POST /api/geese/:id/change-name-url-form**: Change the goose's name using URL form encoded data.\n10. **GET /api/geese/language/:language**: Retrieve geese filtered by programming language.\n11. **GET /api/geese/flock-leaders**: Retrieve all flock leaders.\n12. **GET /api/geese-with-avatar**: Retrieve all geese with avatars.\n13. **POST /api/geese/:id/avatar**: Upload an avatar for the goose.\n14. **GET /api/geese/:id/avatar**: Retrieve the goose's avatar.",
    plan: [
      {
        routeId: 3083,
        route: {
          id: 3083,
          path: "/api/geese",
          method: "GET",
        },
        payload: {
          headers: {},
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3085,
        route: {
          id: 3085,
          path: "/api/geese",
          method: "POST",
        },
        payload: {
          headers: {},
          body: {
            name: "Paul",
            isFlockLeader: true,
            programmingLanguage: "typescript",
            motivations: ["music", "peace"],
            location: "Liverpool",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3088,
        route: {
          id: 3088,
          path: "/api/geese/:id",
          method: "GET",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3089,
        route: {
          id: 3089,
          path: "/api/geese/:id/bio",
          method: "POST",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: {
            bio: "Paul is a musician and songwriter.",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3086,
        route: {
          id: 3086,
          path: "/api/geese/:id/generate",
          method: "POST",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3090,
        route: {
          id: 3090,
          path: "/api/geese/:id/honk",
          method: "POST",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3091,
        route: {
          id: 3091,
          path: "/api/geese/:id",
          method: "PATCH",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: {
            name: "Sir Paul",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3093,
        route: {
          id: 3093,
          path: "/api/geese/:id/motivations",
          method: "PATCH",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: {
            motivations: ["music", "peace", "activism"],
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3094,
        route: {
          id: 3094,
          path: "/api/geese/:id/change-name-url-form",
          method: "POST",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          body: "new_name=Paul%20McCartney",
          bodyType: {
            type: "form-data",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3092,
        route: {
          id: 3092,
          path: "/api/geese/language/:language",
          method: "GET",
        },
        payload: {
          headers: {},
          pathParameters: {
            language: "typescript",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3087,
        route: {
          id: 3087,
          path: "/api/geese/flock-leaders",
          method: "GET",
        },
        payload: {
          headers: {},
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3084,
        route: {
          id: 3084,
          path: "/api/geese-with-avatar",
          method: "GET",
        },
        payload: {
          headers: {},
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3095,
        route: {
          id: 3095,
          path: "/api/geese/:id/avatar",
          method: "POST",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "file",
            isMultipart: false,
          },
        },
      },
      {
        routeId: 3096,
        route: {
          id: 3096,
          path: "/api/geese/:id/avatar",
          method: "GET",
        },
        payload: {
          headers: {},
          pathParameters: {
            id: "1",
          },
          bodyType: {
            type: "json",
            isMultipart: false,
          },
        },
      },
    ],
  };
}
