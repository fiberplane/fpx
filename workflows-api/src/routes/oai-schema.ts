import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { apiErrorSchema, apiResponseSchema, oaiSchemaSchema } from "../types/schema.js";

const router = new OpenAPIHono();

// GET /oai_schema
router.openapi(
  {
    method: "get",
    path: "/oai_schema",
    tags: ["OAI Schema"],
    summary: "List all OAI schemas",
    responses: {
      200: {
        description: "List of OAI schemas",
        content: {
          "application/json": {
            schema: apiResponseSchema(z.array(oaiSchemaSchema)),
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
        data: [] as Array<z.infer<typeof oaiSchemaSchema>>,
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

// GET /oai_schema/:id
router.openapi(
  {
    method: "get",
    path: "/oai_schema/:id",
    tags: ["OAI Schema"],
    summary: "Get OAI schema by ID",
    parameters: [
      {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        description: "OAI Schema ID",
      },
    ],
    responses: {
      200: {
        description: "OAI schema",
        content: {
          "application/json": {
            schema: apiResponseSchema(oaiSchemaSchema),
          },
        },
      },
      404: {
        description: "Schema not found",
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
        data: { id, name: "", content: "" } satisfies z.infer<typeof oaiSchemaSchema>,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message === "Not found") {
        const response = {
          success: false as const,
          error: { message: "Schema not found" },
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