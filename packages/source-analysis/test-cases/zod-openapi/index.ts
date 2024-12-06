import { instrument } from "@fiberplane/hono-otel";
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { basicAuth } from "hono/basic-auth";

const app = new OpenAPIHono();

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

// Define the request/response schema for a route to create a new user
const createUserRoute = createRoute({
  method: "post",
  path: "/users",
  middleware: [
    basicAuth({
      username: "goose",
      password: "honkhonk",
    }),
  ] as const, // Use `as const` to ensure TypeScript infers the middleware's Context correctly
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

// Register the basic auth security scheme
app.openAPIRegistry.registerComponent("securitySchemes", "basicAuth", {
  type: "http",
  scheme: "basic",
});

// Define the handler for a route to create a new user
app.openapi(createUserRoute, async (c) => {
  const { name, age } = c.req.valid("json");
  // Store the name and age in the database
  // but for now, just return the input
  const result = { name, age };
  return c.json(result, 201);
});

// List all users
app.openapi(
  createRoute({
    method: "get",
    path: "/users",
    middleware: [
      basicAuth({
        username: "goose",
        password: "honkhonk",
      }),
    ] as const, // Use `as const` to ensure TypeScript infers the middleware's Context correctly
    request: {},
    responses: {
      20: {
        content: {
          "application/json": {
            schema: z.Array(UserSchema),
          },
        },
        description: "Retrieve all users",
      },
    },
  }),
  async (c) => {
    const { name, age } = c.req.valid("json");
    // Store the name and age in the database
    // but for now, just return the input
    const result = { name, age };
    return c.json([result], 200);
  },
);

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
