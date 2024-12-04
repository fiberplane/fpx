import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../../db/schema.js";
import logger from "../../logger/index.js";
import { resolveServiceArg } from "../../probe-routes.js";
import { getAllSettings } from "../settings/index.js";
import { type OpenApiSpec, isOpenApiSpec } from "./types.js";

type CachedResponse = {
  data: OpenApiSpec;
  timestamp: number;
};

// HACK - We need to cache the OpenAPI spec fetch to avoid infinite loops
//        when the OpenAPI spec is fetched from Studio.
//
//        If the user has a version of @fiberplane/hono-otel >= 0.4.1,
//        then we can remove this cache.
const specResponseCache = new Map<string, CachedResponse>();
const CACHE_TTL_MS = 3000; // 3 seconds

/**
 * Fetches an OpenAPI specification from a URL with caching support.
 *
 * @param url - The URL to fetch the OpenAPI specification from
 * @param options - Fetch options with an optional TTL override
 * @param options.ttl - Cache time-to-live in milliseconds (defaults to CACHE_TTL_MS)
 * @returns Promise that resolves to the parsed OpenAPI specification, or null if:
 *          - The fetch request fails
 *          - The response status is not OK
 *          - The response cannot be parsed as JSON
 */
async function cachedSpecFetch(
  url: string,
  options: RequestInit & { ttl?: number } = {},
): Promise<unknown> {
  const { ttl = CACHE_TTL_MS, ...fetchOptions } = options;

  // Check cache
  const cached = specResponseCache.get(url);
  if (cached && Date.now() - cached.timestamp < ttl) {
    logger.debug(`Returning cached response for ${url}`);
    return cached.data;
  }

  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      logger.error(`Error fetching from ${url}: ${response.statusText}`);
      return null;
    }
    const data = await response.json();

    // Update cache
    specResponseCache.set(url, {
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    logger.error(`Error making fetch to ${url}: ${error}`);
    return null;
  }
}

/**
 * Fetches and parses an OpenAPI specification from a configured URL.
 *
 * @NOTE Caching behavior is here for backwards compatibility with verions of the otel client library
 *       that do not support the `x-fpx-ignore` header.
 *       We can remove the cache once we know that all users have updated to a version of the otel client library
 *       that supports the `x-fpx-ignore` header (0.4.1+)
 *
 * @param db - The database instance to retrieve settings from
 * @param responseTtlMs - Cache time in milliseconds (defaults to CACHE_TTL_MS)
 *
 * @returns Promise that resolves to the parsed OpenAPI specification object, or null if:
 *          - No spec URL is configured
 *          - The URL cannot be resolved
 *          - The fetch request fails
 *          - The response cannot be parsed as JSON
 */
export async function fetchOpenApiSpec(
  db: LibSQLDatabase<typeof schema>,
  responseTtlMs?: number,
): Promise<OpenApiSpec | null> {
  const specUrl = await getSpecUrl(db);
  if (!specUrl) {
    logger.debug(
      "[fetchOpenApiSpec] No OpenAPI spec URL found in settings table",
    );
    return null;
  }
  const resolvedSpecUrl = resolveSpecUrl(specUrl);
  if (!resolvedSpecUrl) {
    logger.debug(
      "[fetchOpenApiSpec] Could not resolve OpenAPI spec URL we got from settings:",
      specUrl,
    );
    return null;
  }

  // NOTE - The caching and special headers are here to avoid infinite loops when the OpenAPI spec is fetched.
  //        I.e., it's possible that the OpenAPI spec is fetched from the target service directly,
  //        in which case, making a request to the target service from Studio will result in the app reporting its routes to Studio,
  //        which will then re-trigger a fetch of the OpenAPI spec from Studio, and so on.
  //
  //        If we want to rely on `x-fpx-ignore`, then we need to make sure that the user has instrumented their app with @fiberplane/hono-otel >= 0.4.1
  //        Since we don't have a way to check the version of @fiberplane/hono-otel in the app yet, we're going with the hacky cache for now.
  //
  const spec = await cachedSpecFetch(resolvedSpecUrl, {
    headers: {
      "x-fpx-ignore": "true",
    },
    ttl: responseTtlMs,
  });

  const isValidSpec = isOpenApiSpec(spec);
  if (spec && !isValidSpec) {
    logger.warn(
      "[fetchOpenApiSpec] Received invalid OpenAPI spec from target service:",
      spec,
    );
  }

  return isValidSpec ? spec : null;
}

/**
 * Retrieves the OpenAPI specification URL from the application settings stored in the database.
 *
 * @param db - The database instance to query settings from
 * @returns Promise that resolves to the configured OpenAPI spec URL, or undefined if not set
 */
async function getSpecUrl(db: LibSQLDatabase<typeof schema>) {
  const settingsRecord = await getAllSettings(db);
  return settingsRecord.openApiSpecUrl;
}

/**
 * Resolves a potentially relative OpenAPI specification URL to an absolute URL.
 * If the input URL is relative, it will be resolved against the service URL
 * obtained from the FPX_SERVICE_TARGET environment variable.
 *
 * @param specUrl - The OpenAPI specification URL to resolve (can be absolute or relative)
 * @returns The resolved absolute URL, or null if the input URL is empty or invalid
 */
function resolveSpecUrl(specUrl: string) {
  if (!specUrl) {
    return null;
  }
  try {
    // Try parsing as URL to check if it's already absolute
    new URL(specUrl);
    return specUrl;
  } catch {
    const serviceTargetArgument = process.env.FPX_SERVICE_TARGET;
    const serviceUrl = resolveServiceArg(serviceTargetArgument);

    // Remove leading slash if present to avoid double slashes
    const cleanSpecUrl = specUrl.startsWith("/") ? specUrl.slice(1) : specUrl;
    return `${serviceUrl}/${cleanSpecUrl}`;
  }
}
