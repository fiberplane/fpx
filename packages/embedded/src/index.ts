import type { Env, MiddlewareHandler } from "hono/types";
import { createRouter } from "./router.js";

export const createMiddleware =
  <E extends Env>(): MiddlewareHandler<E> =>
  async (c, next) => {
    // The middleware gets mounted inside a consumer Hono app under a routePath,
    // we need to remove the prefix routePath for our embedded router to make
    // sure the embedded router matches properly
    const mountedPath = c.req.routePath.replace("/*", "");
    const correctedPath = c.req.path.replace(mountedPath, "");

    // Create a new request with the updated paths
    const newUrl = new URL(c.req.url);
    newUrl.pathname = correctedPath;
    const newRequest = new Request(newUrl, c.req.raw);

    // Let our embedded router handle the request
    const router = createRouter(mountedPath);
    const response = await router.fetch(newRequest);

    // Skip the middleware and continue if the embedded router doesn't match
    if (response.status === 404) {
      return next();
    }

    return response;
  };
