import { type Env, Hono } from "hono";
import createApiRoutes from "./routes/api/index.js";
import createEmbeddedPlayground from "./routes/playground.js";
import type { ResolvedEmbeddedOptions } from "./types.js";

// We use a factory pattern to create routes, which allows for clean dependency injection
// of the apiKey. This keeps the implementation isolated and prevents us from having to
// extend the consuming Hono app's context with our own variables and types.
export function createRouter<E extends Env>(
  options: ResolvedEmbeddedOptions,
): Hono<E> {
  const app = new Hono<E>();

  // Important: whatever gets passed to createEmbeddedPlayground
  // is passed to the playground, aka is on the HTML
  // We therefore remove the apiKey
  const { apiKey, fpxEndpoint, ...sanitizedOptions } = options;

  if (apiKey) {
    app.route("/api", createApiRoutes(apiKey, fpxEndpoint));
  } else {
    app.use("/api/*", async (c) => {
      return c.json({ error: "Fiberplane API key is not set" }, 402);
    });
  }

  const embeddedPlayground = createEmbeddedPlayground(sanitizedOptions);
  app.route("/", embeddedPlayground);

  return app;
}
