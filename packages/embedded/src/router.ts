import { type Env, Hono } from "hono";
import api from "./api/index.js";
import type { EmbeddedMiddlewareOptions } from "./index.js";
import createEmbeddedPlayground from "./playground.js";

export interface EmbeddedRouterOptions extends EmbeddedMiddlewareOptions {
  mountedPath: string;
}

export function createRouter<E extends Env>(
  options: EmbeddedRouterOptions,
): Hono<E> {
  const app = new Hono<E>();

  app.route("/api", api);

  const embeddedPlayground = createEmbeddedPlayground(options);
  app.route("/", embeddedPlayground);

  return app;
}
