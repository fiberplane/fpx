import { instrument } from "@fiberplane/hono-otel";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { dbMiddleware } from "./lib/db";
import { requireSessionSecret } from "./lib/session-auth";
import { externalApiRouter } from "./routes/external";
import { internalApiRouter } from "./routes/internal/api";
import { dashboardAuthRouter } from "./routes/internal/auth";
import { apiReferenceRouter } from "./routes/reference";
import type { AppType } from "./types";

const app = new OpenAPIHono<AppType>();

// Add basic request logging
app.use(logger());

// Set drizzle database on context
app.use(dbMiddleware);

// Session authentication for the dashboard
app.route("/auth", dashboardAuthRouter);

// Internal api
app.use("/internal", requireSessionSecret);
app.route("/internal", internalApiRouter);

// External api
app.route("/api", externalApiRouter);

// Mount OpenAPI documentation and Scalar API Reference
app.doc("/doc", (c) => ({
  openapi: "3.0.0",
  info: {
    title: "Lilo API",
    version: "0.0.1",
    description: "API documentation for Lilo",
  },
  servers: [
    {
      url: new URL(c.req.url).origin,
      description: "Current environment",
    },
  ],
}));
app.route("/reference", apiReferenceRouter);

export default instrument(app);
