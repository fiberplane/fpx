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

export function unregisterRoutes(db: LibSQLDatabase<typeof schema>) {
  return db
    .update(appRoutes)
    .set({ currentlyRegistered: false, registrationOrder: -1 });
}

export function deleteMiddleware(db: LibSQLDatabase<typeof schema>) {
  return db.delete(appRoutes).where(eq(appRoutes.handlerType, "middleware"));
}

export async function reregisterRoutes(
  db: LibSQLDatabase<typeof schema>,
  { routes }: z.infer<typeof schemaProbedRoutes>,
) {
  const currentRoutes = await db
    .select()
    .from(appRoutes)
    .where(
      and(
        eq(appRoutes.handlerType, "route"),
        eq(appRoutes.routeOrigin, "discovered"),
      ),
    );
  for (const [index, route] of routes.entries()) {
    const routeToUpdate =
      route.handlerType === "route" &&
      currentRoutes.find(
        (r) =>
          r.path === route.path &&
          r.method === route.method &&
          r.routeOrigin === "discovered",
      );
    if (routeToUpdate) {
      await db
        .update(appRoutes)
        .set({
          handler: route.handler,
          currentlyRegistered: true,
          registrationOrder: index,
        })
        .where(eq(appRoutes.id, routeToUpdate.id));
    } else {
      await db.insert(appRoutes).values({
        ...route,
        currentlyRegistered: true,
        registrationOrder: index,
      });
    }
  }
}
