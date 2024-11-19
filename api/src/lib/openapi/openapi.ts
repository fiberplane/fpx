import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { z } from "zod";
import type * as schema from "../../db/schema.js";
import type { schemaProbedRoutes } from "../../lib/app-routes.js";
import logger from "../../logger/index.js";
import { fetchOpenApiSpec } from "./fetch.js";
import { mapOpenApiToHonoRoutes } from "./map-routes.js";

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
  logger.info("[addOpenApiSpecToRoutes] length of appRoutes", appRoutes.length);
  return appRoutes.map((route) => {
    logger.debug(
      `Mapping OpenAPI spec to route ${route.path} ${route.method} (handlerType: ${route.handlerType})`,
    );
    // console.log(openApiRoutes);
    const openApiRoute = openApiRoutes.find(
      (r) =>
        route.handlerType === "route" &&
        r.honoPath === route.path &&
        r.method === route.method,
    );
    logger.debug(`Found OpenAPI route ${openApiRoute ? "yes" : "no"}`);
    const result = {
      ...route,
      openApiSpec: openApiRoute?.operation
        ? JSON.stringify(openApiRoute.operation)
        : null,
    };
    if (openApiRoute) {
      logger.debug(`YES Result: ${JSON.stringify(result, null, 2)}`);
    }
    return result;
  });
}
