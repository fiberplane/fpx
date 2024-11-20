import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { z } from "zod";
import type * as schema from "../../db/schema.js";
import type { schemaProbedRoutes } from "../../lib/app-routes.js";
import logger from "../../logger/index.js";
import {
  CircularReferenceError,
  MissingReferenceError,
  dereferenceSchema,
} from "./dereference.js";
import { fetchOpenApiSpec } from "./fetch.js";
import { mapOpenApiToHonoRoutes } from "./map-routes.js";
import type { OpenAPIOperation } from "./types.js";

type Routes = z.infer<typeof schemaProbedRoutes>["routes"];

export async function addOpenApiSpecToRoutes(
  db: LibSQLDatabase<typeof schema>,
  routes: Routes,
) {
  const spec = await fetchOpenApiSpec(db);
  if (!spec) {
    logger.debug("No OpenAPI spec found");
    return [];
  }
  const openApiRoutes = mapOpenApiToHonoRoutes(spec);
  const appRoutes = Array.isArray(routes) ? routes : [routes];

  return appRoutes.map((route) => {
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
}
