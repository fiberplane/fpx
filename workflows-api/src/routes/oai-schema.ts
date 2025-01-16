import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  apiErrorSchema,
  apiResponseSchema,
  oaiSchemaSchema,
} from "../types/schema.js";
import { db } from "../db/index.js";
import { oaiSchema } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { validate } from "@scalar/openapi-parser";

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
      const schemas = await db.select().from(oaiSchema);
      
      const response = {
        success: true as const,
        data: schemas,
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

      const schema = await db.query.oaiSchema.findFirst({
        where: eq(oaiSchema.id, id)
      });
      
      if (!schema) {
        throw new Error("Not found");
      }

      const response = {
        success: true as const,
        data: schema,
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

// POST /oai_schema
router.openapi(
  {
    method: "post",
    path: "/oai_schema",
    tags: ["OAI Schema"],
    summary: "Create a new OAI schema",
    request: {
      body: {
        content: {
          "application/json": {
            schema: oaiSchemaSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "OAI schema created successfully",
        content: {
          "application/json": {
            schema: apiResponseSchema(oaiSchemaSchema),
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
      const { content, name } = await c.req.valid("json");

			// Validate the submitted schema
      const { valid, errors } = await validate(content);

      if (!valid) {
        const errorMessages = errors
          ? errors.map((e) => e.message).join(", ")
          : "Unknown error";
        throw new Error(errorMessages);
      }

      // Generate a unique ID
      const id = crypto.randomUUID();

      const newSchema = {
        id,
        name,
        content,
      };

      // Insert into database
      await db.insert(oaiSchema).values(newSchema);

      const response = {
        success: true as const,
        data: newSchema,
      };

      return c.json(response, 201);
    } catch (error) {
      const response = {
        success: false as const,
        error: {
          message:
            error instanceof Error ? error.message : "Internal server error",
        },
      };
      return c.json(response, error instanceof Error ? 400 : 500);
    }
  },
);

export default router;
