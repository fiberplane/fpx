import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { ZodError } from "zod";
import oaiSchemaRouter from "./routes/oai-schema.js";
import workflowRouter from "./routes/workflow.js";
import type { Variables } from "./schemas/index.js";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./db/schema.js";
import { contextStorage } from "hono/context-storage";
import { instrument } from "@fiberplane/hono-otel";

const app = new OpenAPIHono<{
  Bindings: CloudflareBindings;
  Variables: Variables;
}>().basePath("/api");

app.use(contextStorage());

app.use(async (c, next) => {
  const dbConnection = c.env.DB;
  const db = drizzle(dbConnection, { schema });
  c.set("db", db);
  await next();
});

// Error handlers
app.onError((error, c) => {
  // Handle known error types
  if (error instanceof ZodError) {
    const response = {
      success: false as const,
      error: {
        message: "Validation error",
        details: error.errors,
        type: "ZodError",
      },
    };
    return c.json(response, 400);
  }

  // Handle "Not found" errors
  if (error instanceof Error && error.message === "Not found") {
    const response = {
      success: false as const,
      error: {
        message: "Resource not found",
        type: "NotFoundError",
      },
    };
    return c.json(response, 404);
  }

  // Handle validation errors from OpenAPI schema validation
  if (error instanceof Error && error.message.includes("validation failed")) {
    const response = {
      success: false as const,
      error: {
        message: "Validation error",
        details: error.message,
        type: "ValidationError",
      },
    };
    return c.json(response, 400);
  }

  // All other errors are treated as 500 Internal Server Error
  const response = {
    success: false as const,
    error: {
      message: "Internal server error",
      type: error.constructor.name,
    },
  };

  return c.json(response, 500);
});

app.notFound((c) => {
  const response = {
    success: false as const,
    error: {
      message: "Route not found",
    },
  };
  return c.json(response, 404);
});

// Mount routes
const router = app.route("/", oaiSchemaRouter).route("/", workflowRouter);

app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    title: "Workflows API",
    version: "1.0.0",
    description: "API for managing workflows and OAI schemas",
  },
});

app.get(
  "/docs",
  apiReference({
    spec: { url: "/api/openapi.json" },
  }),
);

export type AppType = typeof router;

// @ts-ignore
// export default instrument(app);
export default app;
