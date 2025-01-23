import type { Context } from "hono";
import type { Env, MiddlewareHandler } from "hono/types";
import { createRouter } from "./router.js";
import type { EmbeddedOptions, ResolvedEmbeddedOptions } from "./types.js";

// HACK - We need to manually update the version in the CDN URL when you release a new version
//        Eventually we should do this automagically when building the package (and derive the version from the package.json)
const VERSION = "0.0.19";
const CDN_URL = `https://cdn.jsdelivr.net/npm/@fiberplane/embedded@${VERSION}/dist/playground/`;

export const createMiddleware =
  <E extends Env>(options: EmbeddedOptions): MiddlewareHandler<E> =>
  async (c, next) => {
    const { mountedPath, internalPath } = getPaths(c);

    // Forward request to embedded router, continuing middleware chain if no route matches
    const router = createRouter({
      cdn: options.cdn ?? CDN_URL,
      mountedPath,
      ...options,
    } satisfies ResolvedEmbeddedOptions);

    // Create a new request with the corrected (internal) path
    const newUrl = new URL(c.req.url);
    newUrl.pathname = internalPath;
    const newRequest = new Request(newUrl, c.req.raw);
    const response = await router.fetch(newRequest);

    // Skip the middleware and continue if the embedded router doesn't match
    if (response.status === 404) {
      return next();
    }

    return response;
  };

// This middleware is designed to be mounted within another Hono app at any path.
// Since the parent app determines the mount path, we need to extract and remove
// this prefix from incoming requests to ensure proper route matching
function getPaths(c: Context): { mountedPath: string; internalPath: string } {
  const mountedPath = c.req.routePath.replace("/*", "");
  const internalPath = c.req.path.replace(mountedPath, "");

  return {
    mountedPath,
    internalPath,
  };
}
