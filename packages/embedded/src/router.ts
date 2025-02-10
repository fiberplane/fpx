import { type Env, Hono } from "hono";
import createApiRoutes from "./routes/api/index.js";
import createEmbeddedPlayground from "./routes/playground.js";
import {FiberplaneAppType, logIfDebug, ResolvedEmbeddedOptions} from "./types.js";

// We use a factory pattern to create routes, which allows for clean dependency injection
// of the apiKey. This keeps the implementation isolated and prevents us from having to
// extend the consuming Hono app's context with our own variables and types.
export function createRouter<E extends Env>(
  options: ResolvedEmbeddedOptions,
): Hono<E> {
  // Important: whatever gets passed to createEmbeddedPlayground
  // is passed to the playground, aka is on the HTML
  // We therefore remove the apiKey
  const { apiKey, fpxEndpoint, debug, ...sanitizedOptions } = options;

  const app = new Hono<E & FiberplaneAppType>();
  const debugEnabled = debug || false;

  app.use(async (c, next) => {
    c.set("debug", debugEnabled);
    await next();
  });

  if (apiKey) {
    logIfDebug(debugEnabled, "creating router as api key is set");
    app.route("/api", createApiRoutes(apiKey, fpxEndpoint));
  } else {
    app.use("/api/*", async (c) => {
      logIfDebug(debugEnabled, "no api key is set, returning early");
      return c.json({ error: "Fiberplane API key is not set" }, 402);
    });
  }

  const embeddedPlayground = createEmbeddedPlayground(sanitizedOptions);
  app.route("/", embeddedPlayground);

  return app;
}
