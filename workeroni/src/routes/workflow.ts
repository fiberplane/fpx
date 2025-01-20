import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  apiErrorSchema,
  apiResponseSchema,
  type Variables,
  workflowCreateSchema,
  workflowSchema,
} from "../schemas/index.js";
import {
  oaiSchema as oaiSchemaTable,
  workflow as workflowTable,
} from "../db/schema.js";
import { eq } from "drizzle-orm";
import { generateWorkflow } from "../ai/index.js";

const router = new OpenAPIHono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>();

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
    const db = c.get("db");
    const workflows = await db.select().from(workflowTable);
    const response = {
      success: true as const,
      data: workflows.map(workflow => ({
        id: workflow.workflowId,
        prompt: "", // FIXME: Add prompt to workflow table
        oaiSchemaId: workflow.oaiSchemaId,
        steps: workflow.steps,
        summary: workflow.summary,
        description: workflow.description,
        lastRunStatus: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
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
        .from(oaiSchemaTable)
        .where(eq(oaiSchemaTable.id, oaiSchemaId))
        .limit(1)
        .then((rows) => rows[0]);

      if (!oaiSchemaContent) {
        throw new Error("OAI schema not found");
      }

      // Generate workflow using AI
      const generatedWorkflow = await generateWorkflow({
        userStory: body.prompt,
        oaiSchema: oaiSchemaContent.content,
      });

      const workflowData = {
        workflowId: newId,
        summary: generatedWorkflow.summary,
        description: generatedWorkflow.description,
        oaiSchemaId: oaiSchemaContent.id,
        steps: generatedWorkflow.steps,
      };

      await db.insert(workflowTable).values(workflowData);

      const response = {
        success: true as const,
        data: {
          id: newId,
          name: body.name,
          prompt: body.prompt,
          oaiSchemaId: oaiSchemaContent.id,
          summary: generatedWorkflow.summary,
          description: generatedWorkflow.description,
          steps: generatedWorkflow.steps,
          lastRunStatus: "pending" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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
    const db = c.get("db");
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

    const workflow = await db
      .select()
      .from(workflowTable)
      .where(eq(workflowTable.workflowId, id))
      .limit(1)
      .then((rows) => rows[0]);

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
      data: {
        id: workflow.workflowId,
        prompt: "", // FIXME: Add prompt to workflow table
        oaiSchemaId: workflow.oaiSchemaId,
        steps: workflow.steps,
        summary: workflow.summary,
        description: workflow.description,
        lastRunStatus: "pending" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
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

    const db = c.get("db");
    const existingWorkflow = await db.query.workflow.findFirst({
      where: eq(workflowTable.workflowId, id),
    });

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

    await db
      .update(workflowTable)
      .set(updatedWorkflow)
      .where(eq(workflowTable.workflowId, id));

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
    const db = c.get("db");
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

    const exists = await db.query.workflow.findFirst({
      where: eq(workflowTable.workflowId, id),
    });

    if (!exists) {
      const error = {
        success: false as const,
        error: {
          message: "Workflow not found",
        },
      };
      return c.json(error, 404);
    }

    await db.delete(workflowTable).where(eq(workflowTable.workflowId, id));
    return new Response(null, { status: 204 });
  },
);

export default router;
