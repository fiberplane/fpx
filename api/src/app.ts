import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import type { WebSocket } from "ws";

import type * as schema from "./db/schema.js";
import type { Bindings, Variables } from "./lib/types.js";
import logger from "./logger.js";

import type * as webhoncType from "./lib/webhonc/index.js";
import appRoutes from "./routes/app-routes.js";
import inference from "./routes/inference.js";
import settings from "./routes/settings.js";
import source from "./routes/source.js";
import traces from "./routes/traces.js";

export function createApp(
  db: LibSQLDatabase<typeof schema>,
  webhonc: typeof webhoncType,
  wsConnections?: Set<WebSocket>,
) {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  // NOTE - This middleware adds `db` on the context so we don't have to initiate it every time
  app.use(async (c, next) => {
    c.set("db", db);

    c.set("webhonc", webhonc);

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
  app.route("/", traces);
  app.route("/", inference);
  app.route("/", source);
  app.route("/", appRoutes);
  app.route("/", settings);

  return app;
}
