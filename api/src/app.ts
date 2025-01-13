import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import type { WebSocket } from "ws";

import type * as schema from "./db/schema.js";
import type { Bindings, Variables } from "./lib/types.js";
import logger from "./logger/index.js";

import { HTTPException } from "hono/http-exception";
import type * as webhoncType from "./lib/webhonc/index.js";
import appRoutes from "./routes/app-routes.js";
import auth from "./routes/auth.js";
import collections from "./routes/collections.js";
import inference from "./routes/inference/index.js";
import settings from "./routes/settings.js";
import traces from "./routes/traces.js";
import { createMiddleware } from "@fiberplane/embedded";

export function createApp(
  db: LibSQLDatabase<typeof schema>,
  webhonc: typeof webhoncType,
  wsConnections?: Set<WebSocket>,
) {
  const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

  app.onError((error, ctx) => {
    logger.error("[app.onError] Error in api:", error);
    if (error instanceof HTTPException) {
      return ctx.json(error.message, error.status);
    }
    return ctx.json(
      error instanceof Error ? error.message : "Unexpected error",
      500,
    );
  });

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
  app.route("/", auth);
  app.route("/", traces);
  app.route("/", inference);
  app.route("/", appRoutes);
  app.route("/", settings);
  app.route("/", collections);

  app.use("/fp/*", createMiddleware());

  return app;
}
