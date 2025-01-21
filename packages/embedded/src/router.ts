import { type Env, Hono } from "hono";
import type { EmbeddedMiddlewareOptions } from "./middleware.js";
import createEmbeddedPlayground from "./routes/playground.js";
import createApiRoutes from "./routes/api/index.js";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export type RouterSpec =
  | {
      type: "url";
      value: string;
      origin: string;
    }
  | {
      type: "path";
      value: string;
      origin: string;
    }
  | {
      type: "raw";
      value: OpenAPIV3_1.Document | OpenAPIV3.Document;
      origin: string;
    }
  | {
      type: "empty";
      value: undefined;
      origin: string;
    };

export interface EmbeddedRouterOptions
  extends Omit<EmbeddedMiddlewareOptions, "spec"> {
  mountedPath: string;
  spec: RouterSpec;
}

// We use a factory pattern to create routes, which allows for clean dependency injection
// of the apiKey. This keeps the implementation isolated and prevents us from having to
// extend the consuming Hono app's context with our own variables and types.
export function createRouter<E extends Env>(
  options: EmbeddedRouterOptions,
): Hono<E> {
  const app = new Hono<E>();

  app.route("/api", createApiRoutes(options.apiKey));

  const embeddedPlayground = createEmbeddedPlayground(options);
  app.route("/", embeddedPlayground);

  return app;
}
