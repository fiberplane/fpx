import fs from "node:fs/promises";
import path from "node:path";
import { google } from "@ai-sdk/google";
import { zValidator } from "@hono/zod-validator";
import { type CoreMessage, generateObject, jsonSchema } from "ai";
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
import { STEP_EVALUATION_SYSTEM_PROMPT } from "../../lib/ai/prompts.js";
import { GENERATE_FLOW_PLAN_SYSTEM_PROMPT } from "../../lib/ai/prompts.js";
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

If a route requires auth, record that as a dependency in some form. We will likely need user input while executing to to complete an auth flow.
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
  reasoning: z
    .string()
    .describe(
      "the reason for calling this endpoint at this point in the sequence",
    ),
  routeId: z.number(),
  route: z.object({
    id: z.number(),
    path: z.string(),
    method: z.string(),
  }),
  exampleRequest: geminiRequestSchema.describe(
    "Example request for the route handler",
  ),
  expectedOutput: z
    .string()
    .describe("a summary of the expected output for this api call"),
  dependencies: z
    .array(z.string())
    .describe(
      "The fully qualified dotpath of the dependencies on other steps in the execution plan",
    ),
});

type PlanStep = z.infer<typeof PlanStepSchema>;

// NOTE - We cannot use `.optional` or `.nullable` from zod because it does not play nicely with structured output from openai... or gemini
const GeminiPlanOutputSchema = z.object({
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
      schema: GeminiPlanOutputSchema,
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
  previousResults: z.array(z.any()).nullable(),
});

const EvaluateNextStepAiResponseSchema = z.object({
  action: z.enum(["execute", "awaitInput"]),
  message: z.string().describe("A message to the user about the next step"),
  modifiedStep: PlanStepSchema,
});

const createStepEvaluationUserPrompt = (
  currentStep: z.infer<typeof PlanStepSchema>,
  previousResults: z.infer<typeof NextStepSchema>["previousResults"],
) => {
  return `
I need you to modify this to fit the existing testing plan. 
Sub in variables as necessary and correct any incorrect headers or things that need like auth tokens or whatever.

# Existing Plan
${JSON.stringify(currentStep, null, 2)}

# Previous Results
${JSON.stringify(previousResults, null, 2)}

===

Always response in valid json according to the schema i provided.
`;
};

app.post(
  "/v0/evaluate-next-step",
  cors(),
  // zValidator("json", NextStepSchema),
  async (ctx) => {
    // const { plan, currentStepIdx, messages: history, previousResults } = ctx.req.valid("json");
    const {
      plan,
      currentStepIdx,
      messages: history,
      previousResults,
    } = await ctx.req.json();

    const currentStep = plan.steps[currentStepIdx];
    if (!currentStep) {
      return ctx.json({ error: "Current step not found" }, 400);
    }

    const model = google("gemini-1.5-pro-latest");

    const messages = [
      ...(history ?? []),
      { role: "assistant" as const, content: JSON.stringify(plan) },
      {
        role: "user" as const,
        content: createStepEvaluationUserPrompt(currentStep, previousResults),
      },
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
      modifiedStep: transformPlanStep(aiResponse.object.modifiedStep),
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
        schema: GeminiPlanOutputSchema,
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

function transformPlanStep(step: PlanStep) {
  return {
    routeId: step.route.id,
    route: step.route,
    reasoning: step.reasoning,
    expectedOutput: step.expectedOutput,
    dependencies: step.dependencies,

    // NOTE: This is the shape of the data expected by the zustand store
    payload: step.exampleRequest,
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

    const outputSchema = jsonSchema({
      //output schema to use for plan generation
      type: "object",
      properties: {
        executionPlan: {
          type: "array",
          description: "a list of steps for this execution plan",
          items: {
            type: "object",
            required: [
              "path",
              "verb",
              "parameters",
              "reasoning",
              "expected output",
            ],
            properties: {
              path: {
                type: "string",
                description: "the path of the api endpoint",
              },
              verb: {
                type: "string",
                description: "the HTTP verb (GET, POST, PUT, DELTE)",
              },
              parameters: {
                type: "string",
                description:
                  "JSON representation of all parameters and values to use. empty object {} if none provided",
              },
              reasoning: {
                type: "string",
                description:
                  "the reason for calling this endpoint at this point in the sequence",
              },
              "expected output": {
                type: "string",
                description:
                  "a summary of the expected output for this api call",
              },
              dependencies: {
                type: "array",
                description:
                  "the fully qualified dotpath of the dependencies on other steps in the execution plan",
                items: {
                  type: "string",
                },
              },
            },
          },
        },
      },
    });

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
      "This plan outlines basic CRUD operations for the goose resource. First, we get all geese to check existing data. Then, we create a new goose and verify its creation by getting it by ID. Finally, we test update operations by changing the bio, incrementing honks, and updating the name.",
    plan: [
      {
        routeId: 3083,
        route: {
          id: 3083,
          path: "/api/geese",
          method: "GET",
        },
        reasoning: "Get all geese to understand existing data",
        expectedOutput: "A list of geese objects",
        dependencies: [],
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
      },
      {
        routeId: 3085,
        route: {
          id: 3085,
          path: "/api/geese",
          method: "POST",
        },
        reasoning: "Create a new goose",
        expectedOutput: "Successfully created goose object",
        dependencies: [],
        payload: {
          path: "/api/geese",
          pathParams: [],
          queryParams: [],
          body: '{"name": "Honker", "isFlockLeader": true, "programmingLanguage": "Python", "motivations": ["bread", "water"], "location": "pond"}',
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
      },
      {
        routeId: 3088,
        route: {
          id: 3088,
          path: "/api/geese/:id",
          method: "GET",
        },
        reasoning: "Get goose by ID to verify creation",
        expectedOutput: "A single goose object with id 1",
        dependencies: [".0"],
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
      },
      {
        routeId: 3089,
        route: {
          id: 3089,
          path: "/api/geese/:id/bio",
          method: "POST",
        },
        reasoning: "Update goose bio",
        expectedOutput: "Successfully updated goose object with new bio",
        dependencies: [".1"],
        payload: {
          path: "/api/geese/1/bio",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: '{"bio": "This is an updated bio"}',
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
      },
      {
        routeId: 3090,
        route: {
          id: 3090,
          path: "/api/geese/:id/honk",
          method: "POST",
        },
        reasoning: "Increment goose honk count",
        expectedOutput: "Successfully incremented goose honk count",
        dependencies: [".1"],
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
      },
      {
        routeId: 3091,
        route: {
          id: 3091,
          path: "/api/geese/:id",
          method: "PATCH",
        },
        reasoning: "Update goose name",
        expectedOutput: "Successfully updated goose object with new name",
        dependencies: [".1"],
        payload: {
          path: "/api/geese/1",
          pathParams: [
            {
              key: ":id",
              value: "1",
            },
          ],
          queryParams: [],
          body: '{"name": "Goose"}',
          bodyType: {
            type: "json",
            isMultipart: false,
          },
          headers: [],
        },
      },
    ],
  };
}
