import { and, eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { z } from "zod";
import * as schema from "../db/schema.js";

const { appRoutes } = schema;

export const schemaProbedRoutes = z.object({
  routes: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      handler: z.string(),
      handlerType: z.string(),
    }),
  ),
});

/**
 * Re-registers all app routes in a database transaction
 *
 * This is used to update the app routes when the client library reports new routes
 *
 * The logic is:
 * - Unregister all routes (including middleware), by setting currentlyRegistered to false
 * - Delete all old middleware, since we don't want stale middleware in the database
 * - Insert all new routes and middleware
 * - Update all routes that changed
 *
 * A route is considered "changed" if there's already a record in the database with
 * the same path and method, with `handlerType === "route"` and `routeOrigin === "discovered"`,
 * but the handler or other information is different
 */
export async function reregisterRoutes(
  db: LibSQLDatabase<typeof schema>,
  { routes }: z.infer<typeof schemaProbedRoutes>,
) {
  return db.transaction(async (tx) => {
    // Unregister all routes
    await tx
      .update(appRoutes)
      .set({ currentlyRegistered: false, registrationOrder: -1 });

    // Delete all old middleware
    await tx.delete(appRoutes).where(eq(appRoutes.handlerType, "middleware"));

    const currentDiscoveredRoutes = await tx
      .select()
      .from(appRoutes)
      .where(
        and(
          eq(appRoutes.handlerType, "route"),
          eq(appRoutes.routeOrigin, "discovered"),
        ),
      );

    // HACK - This is an N+1 query, but we should never have too many routes
    // TODO - Investigate "update many" logic: https://orm.drizzle.team/learn/guides/update-many-with-different-value
    // TODO - Could just delete all old routes we're going to update, then do one big insert
    for (const [index, route] of routes.entries()) {
      const routeToUpdate =
        route.handlerType === "route" &&
        currentDiscoveredRoutes.find(
          (r) => r.path === route.path && r.method === route.method,
        );
      if (routeToUpdate) {
        await tx
          .update(appRoutes)
          .set({
            handler: route.handler,
            currentlyRegistered: true,
            registrationOrder: index,
          })
          .where(eq(appRoutes.id, routeToUpdate.id));
      } else {
        await tx.insert(appRoutes).values({
          ...route,
          currentlyRegistered: true,
          registrationOrder: index,
        });
      }
    }
  });
}
