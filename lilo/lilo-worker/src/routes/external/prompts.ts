import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import * as schema from "../../db/schema";
import type { AppType } from "../../types";
import { createWorkflow } from "../../lib/ai/workflow";
import { eq } from "drizzle-orm";

const router = new OpenAPIHono<AppType>();

// Define schemas
const PromptSchema = z
  .object({
    uuid: z.string().uuid(),
    userStory: z.string(),
    workflow: z.record(z.any()).nullable(),
    promptedBy: z.string(),
    status: z.enum(["pending", "completed", "failed"]),
    error: z.string().optional(),
  })
  .openapi("Prompt");

type PromptResponse = z.infer<typeof PromptSchema>;

const CreatePromptSchema = z
  .object({
    userStory: z.string().openapi({
      example: "As a user, I want to create an account and set my preferences",
      description: "User story describing the desired workflow",
    }),
  })
  .openapi("CreatePrompt");

// Define routes
const submitPromptRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePromptSchema,
        },
      },
    },
  },
  responses: {
    202: {
      content: {
        "application/json": {
          schema: PromptSchema,
        },
      },
      description: "Prompt submitted successfully",
    },
  },
});

const getPromptRoute = createRoute({
  method: "get",
  path: "/{promptId}",
  request: {
    params: z.object({
      promptId: z.string().uuid().openapi({
        description: "Prompt UUID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PromptSchema,
        },
      },
      description: "Prompt details retrieved",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Prompt not found",
    },
  },
});

const listPromptsRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(PromptSchema),
        },
      },
      description: "List of prompts",
    },
  },
});

router.openapi(submitPromptRoute, async (c) => {
  const { userStory } = c.req.valid("json");
  const db = c.get("db");
  const currentUser = c.get("currentUser");
  const anthropicApiKey = c.env.ANTHROPIC_API_KEY;

  if (!currentUser) {
    throw new Error("Missing user context");
  }

  const uuid = crypto.randomUUID();

  try {
    await db.insert(schema.prompts).values({
      id: uuid,
      apiKeyId: currentUser.id,
      prompt: userStory,
      workflowJson: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const project = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.userId, currentUser.id))
      .get();

    if (!project) {
      throw new Error("Project not found");
    }

    const openApiSpec = project.spec;

    if (!openApiSpec) {
      throw new Error("No OpenAPI spec found for project");
    }

    const workflowResult = await createWorkflow({
      openApiSpec,
      userStory,
      apiKey: anthropicApiKey,
    });

    await db
      .update(schema.prompts)
      .set({
        workflowJson: JSON.stringify(workflowResult.workflow),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.prompts.id, uuid));

    const response: PromptResponse = {
      uuid,
      userStory,
      workflow: workflowResult.workflow,
      promptedBy: currentUser.email,
      status: "completed",
    };

    return c.json(response, 202);
  } catch (error) {
    await db
      .update(schema.prompts)
      .set({
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.prompts.id, uuid));

    const response: PromptResponse = {
      uuid,
      userStory,
      workflow: null,
      promptedBy: currentUser.email,
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return c.json(response, 202);
  }
});

router.openapi(getPromptRoute, async (c) => {
  const { promptId } = c.req.valid("param");
  const db = c.get("db");
  const currentUser = c.get("currentUser");

  if (!currentUser) {
    throw new Error("Missing user context");
  }

  const dbPrompt = await db
    .select()
    .from(schema.prompts)
    .where(eq(schema.prompts.id, promptId))
    .get();

  if (!dbPrompt) {
    return c.json({ error: "Prompt not found" }, 404);
  }

  const response: PromptResponse = {
    uuid: dbPrompt.id,
    userStory: dbPrompt.prompt,
    workflow: dbPrompt.workflowJson ? JSON.parse(dbPrompt.workflowJson) : null,
    promptedBy: currentUser.email,
    status: dbPrompt.errorMessage ? "failed" : "completed",
    error: dbPrompt.errorMessage ?? undefined,
  };

  return c.json(response, 200);
});

router.openapi(listPromptsRoute, async (c) => {
  const db = c.get("db");
  const currentUser = c.get("currentUser");

  if (!currentUser) {
    throw new Error("Missing user context");
  }

  const prompts = await db.select().from(schema.prompts);

  const response: PromptResponse[] = prompts.map((prompt) => ({
    uuid: prompt.id,
    userStory: prompt.prompt,
    workflow: prompt.workflowJson ? JSON.parse(prompt.workflowJson) : null,
    promptedBy: currentUser.email,
    status: prompt.errorMessage ? "failed" : "completed",
    error: prompt.errorMessage ?? undefined,
  }));

  return c.json(response, 200);
});

export { router as promptsRouter };
