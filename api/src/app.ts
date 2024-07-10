import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { logger as honoLogger } from "hono/logger";
import type { WebSocket } from "ws";

import { DEFAULT_DATABASE_URL } from "./constants.js";
import * as schema from "./db/schema.js";
import type { Bindings, Variables } from "./lib/types.js";
import logger from "./logger.js";
import appRoutes from "./routes/app-routes.js";
import dependencies from "./routes/dependencies.js";
import issues from "./routes/issues.js";
import logs from "./routes/logs.js";
import openai from "./routes/openai.js";
import settings from "./routes/settings.js";
import source from "./routes/source.js";

export function createApp(wsConnections?: Set<WebSocket>) {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // NOTE - This middleware adds `db` on the context so we don't have to initiate it every time
  // Lau: similarly adding wsConnections so they can be used in outher modules
  app.use(async (c, next) => {
    const sql = createClient({
      url: env(c).FPX_DATABASE_URL ?? DEFAULT_DATABASE_URL,
    });
    const db = drizzle(sql, { schema });
    c.set("db", db);

    if (wsConnections) {
      c.set("wsConnections", wsConnections);
    }

    await next();
  });

  app.use(async (c, next) => {
    try {
      await next();
    } catch (err) {
      logger.error(err);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

  app.use(honoLogger()); // add a logger FWIW..

  // All routes are modularized in the ./routes folder
  app.route("/", logs);
  app.route("/", openai);
  app.route("/", source);
  app.route("/", dependencies);
  app.route("/", issues);
  app.route("/", appRoutes);
  app.route("/", settings);

  return app;
}
