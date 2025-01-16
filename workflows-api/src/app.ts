import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import oaiSchemaRouter from "./routes/oai-schema.js";
import workflowRouter from "./routes/workflow.js";

const app = new OpenAPIHono();

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
    spec: { url: "/openapi.json" },
  }),
);

export type AppType = typeof router;

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
