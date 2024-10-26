import { instrument } from "@fiberplane/hono-otel";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { logger as honoLogger } from "hono/logger";
import * as schema from "./db/schema";

import type { HatchApp } from "./types";
import { createLogger } from "./logger";
import v0Api from "./v0";

const app = new Hono<HatchApp>();

// Add a scoped logger on the context, since our logger depends on the env variables
app.use(async (c, next) => {
  const logger = createLogger(c.env.HONC_LOG_LEVEL);
  c.set("appLogger", logger);
  await next();
});

// Add `db` on the context so we don't have to initiate it every time
app.use(async (c, next) => {
  const db = drizzle(c.env.DB, { schema });
  c.set("db", db);
  await next();
});

// Add a global error handler
// TODO - Use `app.onError`
app.use(async (c, next) => {
  try {
    await next();
  } catch (err) {
    const logger = c.get("appLogger");
    logger.error(err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Very ridiculous auth
app.use(async (c, next) => {
  if (c.env.HONC_IS_LOCAL === "true") {
    await next();
  } else {
    const token = c.req.header("Authorization")?.split(" ")?.[1]?.trim();
    if (token !== c.env.HONC_PASSWORD) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  }
});

// Set up the built-in hono logger, but use debug logs from our logger.
// If you want to see debug logs locally, set `HONC_LOG_LEVEL=debug`,
// when running this worker.
app.use((c, next) =>
  honoLogger((message: string, ...rest: string[]) => {
    const logger = c.get("appLogger");
    logger.debug(message, ...rest);
  })(c, next),
);

app.get("/", (c) => c.text("Hello, world!"));

app.route("/v0", v0Api);

export default instrument(app);
