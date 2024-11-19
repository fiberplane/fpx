import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { resolveServiceArg } from "../../probe-routes.js";
import type * as schema from "../../db/schema.js";
import { getAllSettings } from "../settings/index.js";

/**
 * Get the OpenAPI spec URL from the settings record in the database.
 */
export async function getSpecUrl(db: LibSQLDatabase<typeof schema>) {
  const settingsRecord = await getAllSettings(db);
  return settingsRecord.openApiSpecUrl;
}

/**
 * Resolve the OpenAPI spec URL to an absolute URL.
 *
 * @param specUrl - The spec URL to resolve.
 * @returns The resolved spec URL or null if the spec URL is not provided.
 */
export function resolveSpecUrl(specUrl: string) {
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
    const cleanSpecUrl = specUrl.startsWith('/') ? specUrl.slice(1) : specUrl;
    return `${serviceUrl}/${cleanSpecUrl}`;
  }
}
