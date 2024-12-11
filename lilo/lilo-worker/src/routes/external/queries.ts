import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { AppType } from "../../types";

const router = new OpenAPIHono<AppType>();

// Define schemas
const QuerySchema = z
  .object({
    uuid: z.string().uuid().openapi({
      example: "123e4567-e89b-12d3-a456-426614174000",
      description: "Query UUID",
    }),
    content: z.string().openapi({
      example: "SELECT * FROM users",
      description: "Query content",
    }),
    queriedBy: z.string().openapi({
      example: "user@example.com",
      description: "Email of user who created the query",
    }),
    status: z.enum(["pending", "completed", "failed"]).openapi({
      example: "pending",
      description: "Current status of the query",
    }),
  })
  .openapi("Query");

const CreateQuerySchema = z
  .object({
    content: z.string().openapi({
      example: "SELECT * FROM users",
      description: "Query to execute",
    }),
  })
  .openapi("CreateQuery");

// Define routes
const submitQueryRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateQuerySchema,
        },
      },
    },
  },
  responses: {
    202: {
      content: {
        "application/json": {
          schema: QuerySchema,
        },
      },
      description: "Query submitted successfully",
    },
  },
});

const getQueryRoute = createRoute({
  method: "get",
  path: "/{queryId}",
  request: {
    params: z.object({
      queryId: z.string().uuid().openapi({
        description: "Query UUID",
        example: "123e4567-e89b-12d3-a456-426614174000",
      }),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: QuerySchema,
        },
      },
      description: "Query details retrieved",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Query not found",
    },
  },
});

const listQueriesRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(QuerySchema),
        },
      },
      description: "List of queries",
    },
  },
});

// Implement handlers
router.openapi(submitQueryRoute, async (c) => {
  const { content } = c.req.valid("json");

  // TODO: Implement query submission logic
  const uuid = crypto.randomUUID();
  const queriedBy = "user@example.com"; // Get from auth context

  return c.json(
    {
      uuid,
      content,
      queriedBy,
      status: "pending" as const,
    },
    202,
  );
});

router.openapi(getQueryRoute, async (c) => {
  const { queryId } = c.req.valid("param");

  // TODO: Implement query retrieval logic
  const query = {
    uuid: queryId,
    content: "SELECT * FROM users",
    queriedBy: "user@example.com",
    status: "completed" as const,
  };

  return c.json(query);
});

router.openapi(listQueriesRoute, async (c) => {
  const db = c.get("db");
  const queries = await db.select().from(schema.queries);

  // Map the database results to the expected schema
  const formattedQueries = queries.map((query) => ({
    uuid: query.id, // Assuming 'id' is the UUID
    content: query.query, // Assuming 'query' is the content
    queriedBy: "user@example.com", // Replace with actual queriedBy if available
    status: "completed" as const, // Replace with actual status if available
  }));

  return c.json(formattedQueries, 200);
});

export { router as queriesRouter };
