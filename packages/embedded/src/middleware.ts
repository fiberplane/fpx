import type { Env, MiddlewareHandler } from "hono/types";
import { createRouter } from "./router.js";

export interface EmbeddedMiddlewareOptions {
  apiKey: string;
  cdn?: string;
}

export const createMiddleware =
  <E extends Env>(options: EmbeddedMiddlewareOptions): MiddlewareHandler<E> =>
  async (c, next) => {
    // This middleware is designed to be mounted within another Hono app at any path.
    // Since the parent app determines the mount path, we need to extract and remove
    // this prefix from incoming requests to ensure proper route matching
    const mountedPath = c.req.routePath.replace("/*", "");
    const correctedPath = c.req.path.replace(mountedPath, "");

    // Create a new request with the corrected path
    const newUrl = new URL(c.req.url);
    newUrl.pathname = correctedPath;
    const newRequest = new Request(newUrl, c.req.raw);

    // Forward request to embedded router, continuing middleware chain if no route matches
    const router = createRouter({ mountedPath, ...options });
    const response = await router.fetch(newRequest);

    // Skip the middleware and continue if the embedded router doesn't match
    if (response.status === 404) {
      return next();
    }

    return response;
  };
