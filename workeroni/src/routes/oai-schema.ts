import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  apiErrorSchema,
  apiResponseSchema,
  oaiSchemaSchema,
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
    const db = c.get("db");
    const schemas = await db.select().from(oaiSchema);

    const response = {
      success: true as const,
      data: schemas,
    } satisfies { success: true; data: typeof schemas };
    return c.json(response, 200);
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
    const id = c.req.param("id");
    const db = c.get("db");
    if (!id) {
      throw new Error("Not found");
    }

    const [schema] = await db
      .select()
      .from(oaiSchema)
      .where(eq(oaiSchema.id, id));

    if (!schema) {
      throw new Error("Not found");
    }

    const response = {
      success: true as const,
      data: schema,
    } satisfies { success: true; data: typeof schema };
    return c.json(response, 200);
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

    const response = {
      success: true as const,
      data: newSchema,
    } satisfies { success: true; data: typeof newSchema };

    return c.json(response, 201);
  },
);

export default router;
