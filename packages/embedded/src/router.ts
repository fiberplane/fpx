import { type Env, Hono } from "hono";
import createApiRoutes from "./routes/api/index.js";
import createEmbeddedPlayground from "./routes/playground.js";
import {
  type FiberplaneAppType,
  type ResolvedEmbeddedOptions,
  logIfDebug,
} from "./types.js";

// We use a factory pattern to create routes, which allows for clean dependency injection
// of the apiKey. This keeps the implementation isolated and prevents us from having to
// extend the consuming Hono app's context with our own variables and types.
export function createRouter<E extends Env>(
  options: ResolvedEmbeddedOptions,
): Hono<E & FiberplaneAppType> {
  // Important: whatever gets passed to createEmbeddedPlayground
  // is passed to the playground, aka is on the HTML
  // We therefore remove the apiKey
  const { apiKey, fpxEndpoint, debug, ...sanitizedOptions } = options;

  const app = new Hono<E & FiberplaneAppType>();
  const isDebugEnabled = debug ?? false;

  app.use(async (c, next) => {
    c.set("debug", isDebugEnabled);
    await next();
  });

  // If the API key is present, we create the internal API router
  // Otherwise, we return a 402 error for all internal API requests
  if (apiKey) {
    logIfDebug(
      isDebugEnabled,
      "Fiberplane API Key Present. Creating internal API router.",
    );
    app.route("/api", createApiRoutes(apiKey, fpxEndpoint));
  } else {
    logIfDebug(
      isDebugEnabled,
      "Fiberplane API Key *Not* Present. Internal API router disabled.",
    );
    app.use("/api/*", async (c) => {
      return c.json({ error: "Fiberplane API key is not set" }, 402);
    });
  }

  const embeddedPlayground = createEmbeddedPlayground(sanitizedOptions);
  app.route("/", embeddedPlayground);

  return app;
}
