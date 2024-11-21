import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type * as schema from "../../db/schema.js";
import logger from "../../logger/index.js";
import { resolveServiceArg } from "../../probe-routes.js";
import { getAllSettings } from "../settings/index.js";
import type { OpenApiSpec } from "./types.js";

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
 * Get the OpenAPI spec URL from the settings record in the database.
 */
async function getSpecUrl(db: LibSQLDatabase<typeof schema>) {
  const settingsRecord = await getAllSettings(db);
  return settingsRecord.openApiSpecUrl;
}

/**
 * Resolve the OpenAPI spec URL to an absolute URL.
 *
 * @param specUrl - The spec URL to resolve.
 * @returns The resolved spec URL or null if the spec URL is not provided.
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
