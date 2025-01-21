import type { Env, MiddlewareHandler } from "hono/types";
import type { OpenAPIV3, OpenAPIV3_1 } from "openapi-types";
import { createRouter, type RouterSpec } from "./router.js";

// HACK - We need to manually update the version in the CDN URL when you release a new version
//        Eventually we should do this automagically when building the package (and derive the version from the package.json)
const VERSION = "0.0.15";
const CDN_URL = `https://cdn.jsdelivr.net/npm/@fiberplane/embedded@${VERSION}/dist/playground/`;

export interface EmbeddedMiddlewareOptions {
  apiKey: string;
  cdn?: string;
  spec?: OpenAPIV3_1.Document | OpenAPIV3.Document | string;
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

    const origin = new URL(c.req.url).origin;
    const modSpec: RouterSpec = parseSpecParameter(options?.spec, origin);

    // Forward request to embedded router, continuing middleware chain if no route matches
    const router = createRouter({
      ...options,
      mountedPath,
      cdn: options?.cdn ?? CDN_URL,
      spec: modSpec,
    });
    const response = await router.fetch(newRequest);

    // Skip the middleware and continue if the embedded router doesn't match
    if (response.status === 404) {
      return next();
    }

    return response;
  };

function parseSpecParameter(
  spec: OpenAPIV3_1.Document | OpenAPIV3.Document | string | undefined,
  origin: string,
): RouterSpec {
  if (!spec) {
    return {
      type: "empty",
      value: undefined,
      origin,
    };
  }
  if (typeof spec === "string" && spec.startsWith("/")) {
    return {
      type: "path",
      value: spec,
      origin,
    };
  }
  if (spec && typeof spec === "object") {
    return {
      type: "raw",
      value: spec,
      origin,
    };
  }
  // NOTE - We assume the spec is a URL if it's not a path-like string or an object
  // TODO - Make this more robust, add an unknown type
  return {
    type: "url",
    value: spec,
    origin,
  };
}
