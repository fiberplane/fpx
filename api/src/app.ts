import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import type { WebSocket } from "ws";

import type * as schema from "./db/schema/index.js";
import type { Bindings, Variables } from "./lib/types.js";
import logger from "./logger.js";
import appRoutes from "./routes/app-routes.js";
import dependencies from "./routes/dependencies.js";
import inference from "./routes/inference.js";
import issues from "./routes/issues.js";
import logs from "./routes/logs.js";
import settings from "./routes/settings.js";
import source from "./routes/source.js";

export function createApp(
  db: LibSQLDatabase<typeof schema>,
  wsConnections?: Set<WebSocket>,
) {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // NOTE - This middleware adds `db` on the context so we don't have to initiate it every time
  app.use(async (c, next) => {
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

  // Set up the builtin hono logger, but use debug logs from our logger
  // This means users of fpx cli will not see the request logs in their terminal,
  // but if you want to see them locally, set `FPX_LOG_LEVEL=debug`
  app.use(
    honoLogger((message: string, ...rest: string[]) => {
      logger.debug(message, ...rest);
    }),
  );

  // All routes are modularized in the ./routes folder
  app.route("/", logs);
  app.route("/", inference);
  app.route("/", source);
  app.route("/", dependencies);
  app.route("/", issues);
  app.route("/", appRoutes);
  app.route("/", settings);

  return app;
}
