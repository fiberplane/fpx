import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { z } from "zod";
import type * as schema from "../../db/schema.js";
import type { schemaProbedRoutes } from "../../lib/app-routes/index.js";
import logger from "../../logger/index.js";
import {
  CircularReferenceError,
  MissingReferenceError,
  dereferenceSchema,
} from "./dereference.js";
import { fetchOpenApiSpec } from "./fetch.js";
import { mapOpenApiToHonoRoutes } from "./map-routes.js";
import { type OpenAPIOperation, isOpenApiSpec } from "./types.js";

type Routes = z.infer<typeof schemaProbedRoutes>["routes"];

/**
 * Enriches API routes with their corresponding OpenAPI specifications by fetching OpenAPI definitions
 * and mapping the routes in the spec to Hono routes.
 *
 * If an `openApiSpec` is provided, it will be used instead of fetching the latest spec from the database.
 *
 * This function handles both single routes and arrays of routes.
 *
 * @param db - LibSQL database instance containing the OpenAPI specifications. Used to fetch the latest spec.
 * @param routes - Array of routes to be enriched. Each route should contain path, method,
 *                and handlerType properties for proper matching with OpenAPI specs.
 * @param openApiSpec - Optional OpenAPI specification to use instead of fetching from the database.
 *
 * @returns Array of enriched routes. Each route will contain all original properties plus an
 *          `openApiSpec` property that is either:
 *          - A stringified OpenAPI operation object if a match is found and dereferencing succeeds
 *          - null if no matching OpenAPI spec exists or if dereferencing fails
 *          If any error occurs during enrichment, returns the original routes unchanged.
 *
 * @example
 * const routes = [
 *   { path: "/api/users", method: "get", handlerType: "route" }
 * ];
 * const enrichedRoutes = await addOpenApiSpecToRoutes(db, routes);
 * // enrichedRoutes[0].openApiSpec will contain the stringified OpenAPI operation or null
 */
export async function addOpenApiSpecToRoutes(
  db: LibSQLDatabase<typeof schema>,
  routes: Routes,
  openApiSpec: unknown,
): Promise<Routes> {
  // Only fetch the spec from the database if the provided spec is not a valid OpenAPI spec
  const shouldFetchSpec = !openApiSpec || !isOpenApiSpec(openApiSpec);
  const spec = shouldFetchSpec ? await fetchOpenApiSpec(db) : openApiSpec;

  // Return the routes unchanged if there's no spec to draw from
  if (!spec) {
    return routes;
  }
  const openApiRoutes = mapOpenApiToHonoRoutes(spec);
  const appRoutes = Array.isArray(routes) ? routes : [routes];

  try {
    const enrichedRoutes = appRoutes.map((route) => {
      const openApiRoute = openApiRoutes.find(
        (r) =>
          route.handlerType === "route" &&
          r.honoPath === route.path &&
          r.method === route.method,
      );

      let operation = openApiRoute?.operation;
      if (operation) {
        try {
          operation = dereferenceSchema<OpenAPIOperation>(
            operation,
            spec.components ?? {},
            new Set(),
            new Map(),
          );
        } catch (error) {
          if (
            error instanceof CircularReferenceError ||
            error instanceof MissingReferenceError
          ) {
            logger.warn(`Failed to dereference OpenAPI spec: ${error.message}`);
            operation = undefined;
          } else {
            throw error;
          }
        }
      }

      const result = {
        ...route,
        openApiSpec: operation ? JSON.stringify(operation) : null,
      };

      return result;
    });

    return enrichedRoutes;
  } catch (error) {
    logger.error(`Error enriching routes with OpenAPI spec: ${error}`);
    return appRoutes;
  }
}
