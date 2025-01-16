import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  apiErrorSchema,
  apiResponseSchema,
  workflowCreateSchema,
  workflowSchema,
} from "../types/schema.js";

const router = new OpenAPIHono();

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
    try {
      // Implementation will be added later
      const response = {
        success: true as const,
        data: [] as Array<z.infer<typeof workflowSchema>>,
      };
      return c.json(response, 200);
    } catch (error) {
      const response = {
        success: false as const,
        error: { message: "Internal server error" },
      };
      return c.json(response, 500);
    }
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
      const body = await c.req.json();
      // Implementation will be added later
      const response = {
        success: true as const,
        data: {
          ...body,
          id: "new-id",
          steps: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies z.infer<typeof workflowSchema>,
      };
      return c.json(response, 201);
    } catch (error) {
      const response = {
        success: false as const,
        error: { message: "Internal server error" },
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
    try {
      const id = c.req.param("id");
      if (!id) {
        throw new Error("Not found");
      }

      // Implementation will be added later
      const response = {
        success: true as const,
        data: {
          id,
          name: "",
          prompt: "",
          oaiSchemaId: "",
          steps: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies z.infer<typeof workflowSchema>,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "Not found") {
        const response = {
          success: false as const,
          error: { message: "Workflow not found" },
        };
        return c.json(response, 404);
      }
      const response = {
        success: false as const,
        error: { message: "Internal server error" },
      };
      return c.json(response, 500);
    }
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
    try {
      const id = c.req.param("id");
      if (!id) {
        throw new Error("Not found");
      }

      const body = await c.req.json();
      // Implementation will be added later
      const response = {
        success: true as const,
        data: {
          ...body,
          id,
          steps: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies z.infer<typeof workflowSchema>,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "Not found") {
        const response = {
          success: false as const,
          error: { message: "Workflow not found" },
        };
        return c.json(response, 404);
      }
      const response = {
        success: false as const,
        error: { message: "Internal server error" },
      };
      return c.json(response, 500);
    }
  },
);

// POST /workflow/:id
router.openapi(
  {
    method: "post",
    path: "/workflow/:id",
    tags: ["Workflow"],
    summary: "Execute workflow",
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
        description: "Workflow execution started",
        content: {
          "application/json": {
            schema: apiResponseSchema(workflowSchema),
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
    try {
      const id = c.req.param("id");
      if (!id) {
        throw new Error("Not found");
      }

      // Implementation will be added later
      const response = {
        success: true as const,
        data: {
          id,
          name: "",
          prompt: "",
          oaiSchemaId: "",
          steps: [],
          lastRunStatus: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        } satisfies z.infer<typeof workflowSchema>,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "Not found") {
        const response = {
          success: false as const,
          error: { message: "Workflow not found" },
        };
        return c.json(response, 404);
      }
      const response = {
        success: false as const,
        error: { message: "Internal server error" },
      };
      return c.json(response, 500);
    }
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
    try {
      const id = c.req.param("id");
      if (!id) {
        throw new Error("Not found");
      }

      // Implementation will be added later
      return new Response(null, { status: 204 });
    } catch (error) {
      if (error instanceof Error && error.message === "Not found") {
        const response = {
          success: false as const,
          error: { message: "Workflow not found" },
        };
        return c.json(response, 404);
      }
      const response = {
        success: false as const,
        error: { message: "Internal server error" },
      };
      return c.json(response, 500);
    }
  },
);

export default router; 