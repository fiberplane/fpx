import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../../db/schema.js";
import logger from "../../logger/index.js";
import { resolveServiceArg } from "../../probe-routes.js";
import { getAllSettings } from "../settings/index.js";
import type { OpenApiSpec } from "./types.js";

/**
 * Fetches and parses an OpenAPI specification from a configured URL.
 *
 * @NOTE This function does not validate the payload returned by the OpenAPI spec URL,
 *       it only makes a type assertion.
 *
 * @param db - The database instance to retrieve settings from
 * @returns Promise that resolves to the parsed OpenAPI specification object, or null if:
 *          - No spec URL is configured
 *          - The URL cannot be resolved
 *          - The fetch request fails
 *          - The response cannot be parsed as JSON
 */
export async function fetchOpenApiSpec(db: LibSQLDatabase<typeof schema>) {
  const specUrl = await getSpecUrl(db);
  if (!specUrl) {
    logger.debug("No OpenAPI spec URL found");
    return null;
  }
  const resolvedSpecUrl = resolveSpecUrl(specUrl);
  if (!resolvedSpecUrl) {
    logger.debug("No resolved OpenAPI spec URL found");
    return null;
  }
  try {
    const response = await fetch(resolvedSpecUrl, {
      headers: {
        // NOTE - This is to avoid infinite loops when the OpenAPI spec is fetched from Studio
        //        We need to make sure that the user has instrumented their app with @fiberplane/hono-otel >= 0.4.1
        "x-fpx-ignore": "true",
      },
    });
    if (!response.ok) {
      logger.error(
        `Error fetching OpenAPI spec from ${resolvedSpecUrl}: ${response.statusText}`,
      );
      return null;
    }
    return response.json() as Promise<OpenApiSpec>;
  } catch (error) {
    logger.error(
      `Error making fetch to OpenAPI spec at ${resolvedSpecUrl}: ${error}`,
    );
    return null;
  }
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
