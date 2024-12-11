import { instrument } from "@fiberplane/hono-otel";
import { OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { logger } from "hono/logger";

import * as schema from "./db/schema";
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
  deleteSession,
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

app.get("/logout", async (c) => {
  await deleteSession(c, c.get("db"));
  return c.redirect("/");
});

app.route("/internal/auth", dashboardAuthRouter);
app.route("/internal/api-keys", apiKeysRouter);
app.route("/dashboard", dashboardRouter);

// Mount external api
app.route("/api", externalApiRouter);

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
