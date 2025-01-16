import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import oaiSchemaRouter from "./routes/oai-schema.js";
import workflowRouter from "./routes/workflow.js";

const app = new OpenAPIHono({ strict: false });

app.doc("/docs", {
  openapi: "3.0.0",
  info: {
    title: "Workflows API",
    version: "1.0.0",
    description: "API for managing workflows and OAI schemas",
  },
});

const routes = [oaiSchemaRouter, workflowRouter] as const;

// Mount routes
const router = app
  .basePath("/")
  .route("/", oaiSchemaRouter)
  .route("/", workflowRouter);

export type AppType = typeof router;

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
