import { type Env, Hono } from "hono";
import type { ResolvedEmbeddedOptions } from "./types.js";
import createApiRoutes from "./routes/api/index.js";
import createEmbeddedPlayground from "./routes/playground.js";

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
  const { apiKey, ...sanitizedOptions } = options;

  app.route("/api", createApiRoutes(apiKey));

  const embeddedPlayground = createEmbeddedPlayground(sanitizedOptions);
  app.route("/", embeddedPlayground);

  return app;
}
