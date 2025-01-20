import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  apiErrorSchema,
  apiResponseSchema,
  type Variables,
  workflowCreateSchema,
  workflowSchema,
} from "../schemas/index.js";
import { oaiSchema } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateWorkflow } from "../ai/index.js";

const router = new OpenAPIHono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>();

// Data store
const mockWorkflows = new Map<string, z.infer<typeof workflowSchema>>();

// GET /workflow
router.openapi(
  {
    method: "get",
    path: "/workflow",
    tags: ["Workflow"],
    summary: "List all workflows",
    responses: {
      200: {
        description: "List of workflows",
        content: {
          "application/json": {
            schema: apiResponseSchema(z.array(workflowSchema)),
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const workflows = Array.from(mockWorkflows.values());
    const response = {
      success: true as const,
      data: workflows,
    };
    return c.json(response, 200);
  },
);

// POST /workflow/create
router.openapi(
  {
    method: "post",
    path: "/workflow/create",
    tags: ["Workflow"],
    summary: "Create a new workflow",
    request: {
      body: {
        content: {
          "application/json": {
            schema: workflowCreateSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Workflow created",
        content: {
          "application/json": {
            schema: apiResponseSchema(workflowSchema),
          },
        },
      },
      400: {
        description: "Invalid request",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    try {
      const body = await c.req.valid("json");
      const newId = crypto.randomUUID();
      const db = c.get("db");
      const oaiSchemaId = body.oaiSchemaId;
      const oaiSchemaContent = await db
        .select()
        .from(oaiSchema)
        .where(eq(oaiSchema.id, oaiSchemaId))
        .limit(1);

      if (!oaiSchemaContent) {
        throw new Error("OAI schema not found");
      }

      // Generate workflow using AI
      const generatedWorkflow = await generateWorkflow({
        userStory: body.prompt,
        oaiSchema: oaiSchemaContent[0].content,
      });

      const workflow = {
        id: newId,
        name: body.name,
        prompt: body.prompt,
        oaiSchemaId: oaiSchemaContent[0].id,
        summary: generatedWorkflow.summary,
        description: generatedWorkflow.description,
        steps: generatedWorkflow.steps,
        lastRunStatus: "pending" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWorkflows.set(newId, workflow);

      const response = {
        success: true as const,
        data: workflow,
      };
      return c.json(response, 201);
    } catch (error) {
      const response = {
        success: false as const,
        error: {
          message: "Failed to generate workflow",
        },
      };
      return c.json(response, 500);
    }
  },
);

// GET /workflow/:id
router.openapi(
  {
    method: "get",
    path: "/workflow/:id",
    tags: ["Workflow"],
    summary: "Get workflow by ID",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Workflow ID",
      },
    ],
    responses: {
      200: {
        description: "Workflow details",
        content: {
          "application/json": {
            schema: apiResponseSchema(workflowSchema),
          },
        },
      },
      400: {
        description: "Invalid workflow ID",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      404: {
        description: "Workflow not found",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const id = c.req.param("id");
    if (!id) {
      const error = {
        success: false as const,
        error: {
          message: "Invalid workflow ID",
        },
      };
      return c.json(error, 400);
    }

    const workflow = mockWorkflows.get(id);

    if (!workflow) {
      const error = {
        success: false as const,
        error: {
          message: "Workflow not found",
        },
      };
      return c.json(error, 404);
    }

    const response = {
      success: true as const,
      data: workflow,
    };
    return c.json(response, 200);
  },
);

// PUT /workflow/:id
router.openapi(
  {
    method: "put",
    path: "/workflow/:id",
    tags: ["Workflow"],
    summary: "Update workflow",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Workflow ID",
      },
    ],
    request: {
      body: {
        content: {
          "application/json": {
            schema: workflowCreateSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Workflow updated",
        content: {
          "application/json": {
            schema: apiResponseSchema(workflowSchema),
          },
        },
      },
      400: {
        description: "Invalid workflow ID",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      404: {
        description: "Workflow not found",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const id = c.req.param("id");
    if (!id) {
      const error = {
        success: false as const,
        error: {
          message: "Invalid workflow ID",
        },
      };
      return c.json(error, 400);
    }

    const existingWorkflow = mockWorkflows.get(id);

    if (!existingWorkflow) {
      const error = {
        success: false as const,
        error: {
          message: "Workflow not found",
        },
      };
      return c.json(error, 404);
    }

    const body = await c.req.json();
    const updatedWorkflow = {
      ...existingWorkflow,
      ...body,
      updatedAt: new Date(),
    };

    mockWorkflows.set(id, updatedWorkflow);

    const response = {
      success: true as const,
      data: updatedWorkflow,
    };
    return c.json(response, 200);
  },
);

// DELETE /workflow/:id
router.openapi(
  {
    method: "delete",
    path: "/workflow/:id",
    tags: ["Workflow"],
    summary: "Delete workflow",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "Workflow ID",
      },
    ],
    responses: {
      204: {
        description: "Workflow deleted",
      },
      400: {
        description: "Invalid workflow ID",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      404: {
        description: "Workflow not found",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
      500: {
        description: "Server error",
        content: {
          "application/json": {
            schema: apiErrorSchema,
          },
        },
      },
    },
  },
  async (c) => {
    const id = c.req.param("id");
    if (!id) {
      const error = {
        success: false as const,
        error: {
          message: "Invalid workflow ID",
        },
      };
      return c.json(error, 400);
    }

    const exists = mockWorkflows.has(id);

    if (!exists) {
      const error = {
        success: false as const,
        error: {
          message: "Workflow not found",
        },
      };
      return c.json(error, 404);
    }

    mockWorkflows.delete(id);
    return new Response(null, { status: 204 });
  },
);

export default router;
