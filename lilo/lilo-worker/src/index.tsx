import { instrument } from "@fiberplane/hono-otel";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";

import { dbMiddleware } from "./lib/db";
import type { AppType } from "./types";

import { dashboardAuthRouter } from "./routes/dashboard/auth";
// Internal routes
import { dashboardRouter } from "./routes/dashboard/dashboard";
import { apiKeysRouter } from "./routes/internal/api-keys";

import { apiReference } from "@scalar/hono-api-reference";
import {
  addCurrentUserToContext,
  dashboardAuthentication,
  requireSessionSecret,
} from "./lib/session-auth";
// External routes
import { externalApiRouter } from "./routes/external";

const app = new OpenAPIHono<AppType>();

// Add basic request logging
app.use(logger());

// Set drizzle database on context
app.use(dbMiddleware);

// Mount internal routes
app.get("/", requireSessionSecret, addCurrentUserToContext, (c) => {
  const currentUser = c.get("currentUser");

  if (currentUser) {
    return c.redirect("/dashboard");
  }

  return c.html(
    <div>
      Hello, want to log in?
      <a href="/internal/auth/github">Login</a>
    </div>,
  );
});
app.route("/internal/auth", dashboardAuthRouter);
app.route("/dashboard", dashboardRouter);
app.route("/api-keys", apiKeysRouter);

// Mount external api
app.route("/api", externalApiRouter);

// Mount OpenAPI documentation
app.doc("/doc", {
  openapi: "3.0.0",
  info: {
    title: "Lilo API",
    version: "1.0.0",
    description: "API documentation for Lilo",
  },
});

app.get(
  "/reference",
  apiReference({
    spec: {
      url: "/doc", // URL to your OpenAPI specification
    },
    theme: "purple", // Optional: choose a theme like 'default', 'moon', 'purple', etc.
    pageTitle: "Hono API Reference", // Optional: set a custom page title
  }),
);

// Health check route
app.get("/health", (c) => c.json({ status: "ok" }));

export default instrument(app);
