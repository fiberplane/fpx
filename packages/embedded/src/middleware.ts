import type { Context } from "hono";
import type { Env, MiddlewareHandler } from "hono/types";
import packageJson from "../package.json" assert { type: "json" };
import { logIfDebug } from "./debug.js";
import { createRouter } from "./router.js";
import type { EmbeddedOptions, ResolvedEmbeddedOptions } from "./types.js";

const VERSION = packageJson.version;
const CDN_URL = `https://cdn.jsdelivr.net/npm/@fiberplane/embedded@${VERSION}/dist/playground/`;

export const createMiddleware =
  <E extends Env>(options: EmbeddedOptions): MiddlewareHandler<E> =>
  async (c, next) => {
    const debug = options.debug ?? false;
    logIfDebug(debug, "debug logs are enabled");

    const { mountedPath, internalPath } = getPaths(c);
    const fpxEndpoint = getFpxEndpoint(c);
    // Forward request to embedded router, continuing middleware chain if no route matches
    const router = createRouter({
      cdn: options.cdn ?? CDN_URL,
      mountedPath,
      fpxEndpoint,
      ...options,
    } satisfies ResolvedEmbeddedOptions);

    // Create a new request with the corrected (internal) path
    const newUrl = new URL(c.req.url);
    newUrl.pathname = internalPath;
    const newRequest = new Request(newUrl, c.req.raw);

    logIfDebug(debug, "Making internal api request to", newUrl.toString());

    const response = await router.fetch(newRequest);

    logIfDebug(
      debug,
      "Finished internal api request to",
      newUrl.toString(),
      "returned",
      response.status,
    );

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

function getFpxEndpoint(c: Context): string | undefined {
  return c?.env?.FPX_ENDPOINT;
}
