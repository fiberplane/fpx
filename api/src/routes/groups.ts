import { Hono } from "hono";
import { z } from "zod";

import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import {
  type NewGroup,
  appRoutes,
  groups,
  groupsAppRoutes,
} from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Create a new collection
app.post("/v0/groups", async (ctx) => {
  const db = ctx.get("db");
  const newCollectionSchema = z.object({
    name: z.string(),
  });

  const newCollection: NewGroup = newCollectionSchema.parse(
    await ctx.req.json(),
  );
  try {
    const collectionId = await db
      .insert(groups)
      .values(newCollection)
      .returning({ id: groups.id });
    return ctx.json({ id: collectionId[0].id }, 201);
  } catch (error) {
    return ctx.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
    );
  }
});

// Get all collections
app.get("/v0/groups", async (ctx) => {
  const db = ctx.get("db");

  try {
    const allCollections = await db.select().from(groups);
    const collectionWithRoutes = await Promise.all(
      allCollections.map(async (collection) => {
        const routes = await db
          .select()
          .from(groupsAppRoutes)
          .where(eq(groupsAppRoutes.collectionId, collection.id));
        return {
          ...collection,
          routes: routes.map((route) => route.appRouteId),
        };
      }),
    );
    return ctx.json(collectionWithRoutes);
  } catch (error) {
    return ctx.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      500,
    );
  }
});

// Get a single collection by ID
app.get(
  "/v0/groups/:id",
  zValidator("param", z.object({ id: z.number() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    try {
      const collection = await db
        .select()
        .from(groups)
        .where(eq(groups.id, id))
        .get();

      if (collection) {
        const routes = await db
          .select(
            {
              id: groupsAppRoutes.appRouteId,
            },
            //   {
            //   id: appRoutes.id,
            //   method: appRoutes.method,
            //   path: appRoutes.path,
            //   handler: appRoutes.handler,
            //   handlerType: appRoutes.handlerType,
            // }
          )
          .from(groupsAppRoutes)
          .where(eq(groupsAppRoutes.collectionId, id))
          .rightJoin(appRoutes);
        // .leftJoin(
        //   appRoutes,
        //   eq(collectionAppRoutes.appRouteId, appRoutes.id),
        // );

        return ctx.json({
          ...collection,
          routes: routes.map((route) => route.id),
        });
      }

      return ctx.json({ error: "Collection not found" }, 404);
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : "Unexpected error" },
        500,
      );
    }
  },
);

// Update a collection by ID
app.put(
  "/v0/groups/:id",
  zValidator("param", z.object({ id: z.number() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    const updateCollectionSchema = z.object({
      name: z.string().optional(),
    });

    const updatedCollection = updateCollectionSchema.parse(
      await ctx.req.json(),
    );
    try {
      await db.update(groups).set(updatedCollection).where(eq(groups.id, id));
      return ctx.json({ message: "Collection updated" });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : "Unexpected error" },
        500,
      );
    }
  },
);

// Delete a collection by ID
app.delete(
  "/v0/groups/:id",
  zValidator("param", z.object({ id: z.number() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    try {
      await db.delete(groups).where(eq(groups.id, id));
      await db
        .delete(groupsAppRoutes)
        .where(eq(groupsAppRoutes.collectionId, id));
      return ctx.json({ message: "Collection deleted" });
    } catch (error) {
      return ctx.json(
        { error: error instanceof Error ? error.message : "Unexpected error" },
        500,
      );
    }
  },
);
