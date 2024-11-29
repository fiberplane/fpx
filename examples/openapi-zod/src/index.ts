import { instrument } from "@fiberplane/hono-otel";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { basicAuth } from "hono/basic-auth";
import * as schema from "./db/schema";
// TODO - Figure out how to use drizzle with "@hono/zod-openapi"
//
// import { UserSchema } from "./db/schema";

type Bindings = {
  DB: D1Database;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

// Schema that defines presence of an ID in the path
const UserIdPathParamSchema = z.object({
  id: z
    // Path params are always strings
    .string()
    // But an ID is always a number
    .regex(/^\d+$/)
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: "123",
    }),
});

// Schema that defines the body of a request to create a new user
const NewUserSchema = z
  .object({
    name: z.string().openapi({
      example: "John Doe",
      description: "The name of the user",
    }),
    age: z.number().openapi({
      example: 42,
    }),
  })
  .openapi("NewUser");

// Schema that defines the response of a request to get a user
// TODO - Figure out how to extend the NewUserSchema object
const UserSchema = z
  .object({
    id: z.number().openapi({
      example: 123,
    }),
    name: z.string().openapi({
      example: "John Doe",
    }),
    age: z.number().openapi({
      example: 42,
    }),
  })
  .openapi("User");

// Define the request/response schema for a route to get a user by ID
const getUserRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  request: {
    params: UserIdPathParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "Retrieve the user",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Invalid ID",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "User not found",
    },
  },
});

// Define the request/response schema for a route to list users
const listUsersRoute = createRoute({
  method: "get",
  path: "/users",
  request: {
    query: z.object({
      name: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(UserSchema),
        },
      },
      description: "List all users",
    },
  },
});

// Define the request/response schema for a route to create a new user
const createUserRoute = createRoute({
  method: "post",
  path: "/users",
  request: {
    body: {
      content: {
        "application/json": {
          schema: NewUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "Retrieve the user",
    },
  },
});

// Define the request/response schema for a route to delete a user by ID
// Add in basic auth middleware to the route to show how to add security to an endpoint
const deleteUserRoute = createRoute({
  method: "delete",
  path: "/users/{id}",
  security: [
    {
      basicAuth: [],
    },
  ],
  middleware: [
    basicAuth({
      username: "goose",
      password: "honkhonk",
    }),
  ] as const, // Use `as const` to ensure TypeScript infers the middleware's Context correctly
  request: {
    params: UserIdPathParamSchema,
  },
  responses: {
    204: {
      description: "User deleted",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: "Unauthorized - Invalid credentials",
    },
  },
});

// Register the basic auth security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "basicAuth", {
  type: "http",
  scheme: "basic",
});

// Define the handler for a route to get a user by ID
app.openapi(getUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const db = drizzle(c.env.DB);

  const idNumber = +id;
  if (Number.isNaN(idNumber) || idNumber < 1) {
    return c.json({ error: "Invalid ID" }, 400);
  }

  const [result] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, idNumber));

  if (!result) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json(result, 200);
});

// Define the handler for a route to list users
app.openapi(listUsersRoute, async (c) => {
  const { name } = c.req.valid("query");
  const db = drizzle(c.env.DB);

  // Only apply where clause if name is provided and not empty
  const query = db.select().from(schema.users);
  if (name && name.trim() !== "") {
    query.where(eq(schema.users.name, name));
  }

  const result = await query;
  return c.json(result, 200);
});

// Define the handler for a route to create a new user
app.openapi(createUserRoute, async (c) => {
  const { name, age } = c.req.valid("json");
  const db = drizzle(c.env.DB);
  const [result] = await db
    .insert(schema.users)
    .values({
      name,
      age,
    })
    .returning();
  return c.json(result, 201);
});

// Define the handler for a route to delete a user by ID
app.openapi(deleteUserRoute, async (c) => {
  const { id } = c.req.valid("param");
  const db = drizzle(c.env.DB);
  await db.delete(schema.users).where(eq(schema.users.id, +id));
  return c.body(null, 204);
});

// Mount the api documentation
// The OpenAPI documentation will be available at /doc
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Simple Hono OpenAPI API",
  },
});

// Define a simple route to test the API (this is not part of the OpenAPI spec)
app.get("/", (c) => {
  return c.text("Hello Hono OpenAPI!");
});

export default instrument(app);
