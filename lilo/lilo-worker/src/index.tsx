import { instrument } from "@fiberplane/hono-otel";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { eq } from "drizzle-orm";
import { logger } from "hono/logger";
import * as schema from "./db/schema";
import { dbMiddleware } from "./lib/db";
import {
  addCurrentUserToContext,
  requireSessionSecret,
} from "./lib/session-auth";
import { externalApiRouter } from "./routes/external";
import { internalApiRouter } from "./routes/internal/api";
import { dashboardAuthRouter } from "./routes/internal/auth";
import { dashboardRouter } from "./routes/ssr-dashboard/dashboard";
import type { AppType } from "./types";

const app = new OpenAPIHono<AppType>();

// Add basic request logging
app.use(logger());

// Set drizzle database on context
app.use(dbMiddleware);

// Authentication
app.route("/auth", dashboardAuthRouter);

// Internal api
app.route("/internal", internalApiRouter);

// External api
app.route("/api", externalApiRouter);

// NOTE - This is logic for an SSR dashboard from when I was prototyping, not meant for prod use
// TODO - Delete this code
app.get("/", requireSessionSecret, addCurrentUserToContext, (c) => {
  const currentUser = c.get("currentUser");

  if (currentUser) {
    return c.redirect("/dashboard");
  }

  return c.html(
    <div>
      Hello, want to log in?
      <a href="/auth/github">Login</a>
    </div>,
  );
});
app.route("/dashboard", dashboardRouter);

// Mount OpenAPI documentation
app.doc("/doc", (c) => ({
  openapi: "3.0.0",
  info: {
    title: "Lilo API",
    version: "1.0.0",
    description: "API documentation for Lilo",
  },
  servers: [
    {
      url: new URL(c.req.url).origin,
      description: "Current environment",
    },
  ],
}));

app.get("/reference", addCurrentUserToContext, async (c, next) => {
  let apiKey = "";
  const db = c.get("db");
  const currentUser = c.get("currentUser");
  if (currentUser) {
    apiKey =
      (await db
        .select()
        .from(schema.apiKeys)
        .where(eq(schema.apiKeys.userId, currentUser.id))
        .then((res) => res[0]?.key)) ?? "";
  }

  const reference = apiReference({
    spec: {
      url: "/doc", // URL to your OpenAPI specification
    },
    // Optional: choose a theme like 'default', 'moon', 'purple', etc.
    theme: "purple",
    pageTitle: "Lilo API Reference",
    authentication: {
      http: {
        // NOTE - Need to specify basic, even though we don't use it
        basic: {
          username: "",
          password: "",
        },
        bearer: {
          token: apiKey,
        },
      },
    },
  });

  // @ts-expect-error - TODO: fix this to incorporate the variables set by the scalar middleware
  return reference(c, next);
});

// Health check route
app.get("/health", (c) => c.json({ status: "ok" }));

export default instrument(app);
