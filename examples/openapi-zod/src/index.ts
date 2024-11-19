import { instrument } from "@fiberplane/hono-otel";
import { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";

import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema";
// TODO - Figure out how to use drizzle with "@hono/zod-openapi"
//
// import { UserSchema } from "./db/schema";

type Bindings = {
  DB: D1Database;
};

const app = new OpenAPIHono<{ Bindings: Bindings }>();

const ParamsSchema = z.object({
  id: z
    .number()
    // .min(1)
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
      example: 1212121,
    }),
});

const NewUserSchema = z
  .object({
    name: z.string().openapi({
      example: "John Doe",
    }),
    age: z.number().openapi({
      example: 42,
    }),
  })
  .openapi("NewUser");

// TODO - Figure out how to extend the NewUserSchema object
//
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

const getUserRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  request: {
    params: ParamsSchema,
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
  },
});

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

app.openapi(getUserRoute, (c) => {
  const { id } = c.req.valid("param");

  const idNumber = +id;
  if (Number.isNaN(idNumber) || idNumber < 1) {
    return c.json({ error: "Invalid ID" }, 400);
  }
  return c.json(
    {
      id: idNumber,
      age: 20,
      name: "Ultra-user",
    },
    200,
  );
});

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

// The OpenAPI documentation will be available at /doc
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});

app.get("/", (c) => {
  return c.text("Hello Hono OpenAPI!");
});

export default instrument(app);
