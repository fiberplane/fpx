import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  apiErrorSchema,
  apiResponseSchema,
  openApiSchema,
} from "../schemas/index";
import { oaiSchema } from "../db/schema.js";
import { eq } from "drizzle-orm";
import type { Variables } from "../schemas/index";

const router = new OpenAPIHono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>();

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
            schema: apiResponseSchema(z.array(openApiSchema)),
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
    const schemas = await db.select().from(oaiSchema);
    return c.json({ data: schemas }, 200);
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
            schema: apiResponseSchema(openApiSchema),
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
    const id = c.req.param("id");
    const db = c.get("db");
    if (!id) {
      return c.json({ error: { message: "Not found" } }, 404);
    }

    const [schema] = await db
      .select()
      .from(oaiSchema)
      .where(eq(oaiSchema.id, id));

    if (!schema) {
      return c.json({ error: { message: "Not found" } }, 404);
    }

    return c.json({ data: schema }, 200);
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
            schema: openApiSchema.omit({ id: true }),
          },
        },
      },
    },
    responses: {
      201: {
        description: "OAI schema created successfully",
        content: {
          "application/json": {
            schema: apiResponseSchema(openApiSchema),
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
    const { content, name } = c.req.valid("json");

    // Generate a unique ID
    const id = crypto.randomUUID();

    const db = c.get("db");

    const newSchema = {
      id,
      name,
      content,
    };

    // Insert into database
    await db.insert(oaiSchema).values(newSchema);

    return c.json({ data: newSchema }, 201);
  },
);

export default router;
