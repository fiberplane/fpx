import { type Env, Hono } from "hono";
import { logIfDebug } from "./debug.js";
import createApiRoutes from "./routes/api/index.js";
import createEmbeddedPlayground from "./routes/playground.js";
import type { FiberplaneAppType, ResolvedEmbeddedOptions } from "./types.js";
import createRunnerRoute from "./routes/runner/index.js";
import { contextStorage } from "hono/context-storage";

// We use a factory pattern to create routes, which allows for clean dependency injection
// of the apiKey. This keeps the implementation isolated and prevents us from having to
// extend the consuming Hono app's context with our own variables and types.
export function createRouter<E extends Env>(
  options: ResolvedEmbeddedOptions<E>,
): Hono<E & FiberplaneAppType<E>> {
  // Important: whatever gets passed to createEmbeddedPlayground
  // is passed to the playground, aka is on the HTML
  // We therefore remove the apiKey
  const { apiKey, fpxEndpoint, debug, ...sanitizedOptions } = options;

  const app = new Hono<E & FiberplaneAppType<E>>();
  const isDebugEnabled = debug ?? false;

  app.use(async (c, next) => {
    c.set("debug", isDebugEnabled);
    await next();
  });

  app.use(contextStorage());

  app.use(async (c, next) => {
    await next();
    logIfDebug(isDebugEnabled, "==== matched routes ====");
    for (const [
      i,
      { handler, method, path },
    ] of c.req.matchedRoutes.entries()) {
      const name =
        handler.name || (handler.length < 2 ? "[handler]" : "[middleware]");
      logIfDebug(
        isDebugEnabled,
        method,
        " ",
        path,
        " ".repeat(Math.max(10 - path.length, 0)),
        name,
        i === c.req.routeIndex ? "<- respond from here" : "",
      );
    }
    logIfDebug(isDebugEnabled, "==== end of matched routes ====");
  });

  app.use(async (c, next) => {
    c.set("userApp", options.userApp);
    c.set("userEnv", options.userEnv);
    await next();
  });

  // If the API key is present, we create the internal API router
  // Otherwise, we return a 402 error for all internal API requests
  if (apiKey) {
    logIfDebug(
      isDebugEnabled,
      "Fiberplane API Key Present. Creating internal API router.",
    );
    app.route("/w", createRunnerRoute(apiKey));
    app.route("/api", createApiRoutes(apiKey, fpxEndpoint));
  } else {
    logIfDebug(
      isDebugEnabled,
      "Fiberplane API Key *Not* Present. Internal API router disabled.",
    );
    app.use("/api/*", async (c) => {
      return c.json({ error: "Fiberplane API key is not set" }, 402);
    });
    app.use("/w/*", async (c) => {
      return c.json({ error: "Fiberplane API key is not set" }, 402);
    });
  }

  const embeddedPlayground = createEmbeddedPlayground<E>(sanitizedOptions);
  app.route("/", embeddedPlayground);

  return app;
}
