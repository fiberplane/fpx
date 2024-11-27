import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import {
  type NewCollection,
  appRoutes,
  collections,
  collectionsAppRoutes,
} from "../db/schema.js";
import { ExtraRequestParamsSchema } from "@fiberplane/fpx-types";;
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const newCollectionSchema = z.object({
  name: z.string(),
});

// Create a new collection
app.post("/v0/collections", async (ctx) => {
  const db = ctx.get("db");

  const newCollection: NewCollection = newCollectionSchema.parse(await ctx.req.json());

  try {
    const collection = await db.transaction(async (db) => {
      const collectionWithName = await db.query.collections.findFirst({
        where: eq(collections.name, newCollection.name),
      });
      if (collectionWithName) {
        throw new HTTPException(400, {
          message: "Collection name is not unique",
          cause: { name: "Collection name is not unique" },
        });
      }

      return await db.insert(collections).values(newCollection).returning({
        id: collections.id,
        name: collections.name,
        createdAt: collections.createdAt,
        updatedAt: collections.updatedAt,
      });
    });

    return ctx.json(collection[0]);
  } catch (error) {
    if (error instanceof HTTPException) {
      return ctx.json(error.message, error.status);
    }

    return ctx.json(
      error instanceof Error ? error.message : "Unexpected error",
      500,
    );
  }
});

app.post(
  "/v0/collections/:collectionId/app-routes",
  zValidator("param", z.object({ collectionId: z.number({ coerce: true }) })),
  zValidator("json",
    ExtraRequestParamsSchema.extend(
      { id: z.number() })),
  async (ctx) => {
    const db = ctx.get("db");

    const { collectionId } = ctx.req.valid("param");
    const { id: appRouteId, ...extraParams } = ctx.req.valid("json");

    try {
      const updatedCollection = await db.transaction(async (db) => {
        const collection = db.query.collections.findFirst({
          where: eq(collections.id, collectionId),
        });
        if (!collection) {
          throw new HTTPException(404, {
            message: "Collection not found",
          });
        }

        const route = db.query.appRoutes.findFirst({
          where: eq(appRoutes.id, appRouteId),
        });
        if (!route) {
          throw new HTTPException(404, {
            message: "Route not found",
          });
        }

        await db.insert(collectionsAppRoutes).values({
          collectionId,
          appRouteId,
          ...extraParams
        });

        return db.query.collections.findFirst({
          where: eq(collections.id, collectionId),
          with: {
            collectionsAppRoutes: {
              with: {
                appRoute: true,
              },
            },
          },
        });
      });

      return ctx.json(updatedCollection);
    } catch (error) {
      if (error instanceof HTTPException) {
        return ctx.json(error.message, error.status);
      }

      return ctx.json(
        error instanceof Error ? error.message : "Unexpected error",
        500,
      );
    }
  },
);

// Get all collections
app.get("/v0/collections", async (ctx) => {
  const db = ctx.get("db");

  try {
    const allCollections = await db.select().from(collections);
    const collectionWithRoutes = await Promise.all(
      allCollections.map(async (collection) => {
        const routes = await db
          .select()
          .from(collectionsAppRoutes)
          .where(eq(collectionsAppRoutes.collectionId, collection.id));
        return {
          ...collection,
          appRoutes: routes.map(({ collectionId: _, ...route }) => route),
        };
      }),
    );
    return ctx.json(collectionWithRoutes);
  } catch (error) {
    return ctx.json(
      error instanceof Error ? error.message : "Unexpected error",
      500,
    );
  }
});

// Get a single collection by ID
app.get(
  "/v0/collections/:id",
  zValidator("param", z.object({ id: z.number() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    try {
      const collection = await db.query.collections.findFirst({
        where: eq(collections.id, id),
        with: {
          collectionsAppRoutes: true,
        },
      });
      if (!collection) {
        throw new HTTPException(404, {
          message: "Collection not found",
        });
      }

      return ctx.json({
        ...collection,
      });
    } catch (error) {
      if (error instanceof HTTPException) {
        return ctx.json(error.message, error.status);
      }

      return ctx.json(
        error instanceof Error ? error.message : "Unexpected error",
        500,
      );
    }
  },
);

// Update a collection by ID
app.put(
  "/v0/collections/:id",
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
      await db.update(collections).set(updatedCollection).where(eq(collections.id, id));
      return ctx.json({ message: "Collection updated" });
    } catch (error) {
      return ctx.json(
        error instanceof Error ? error.message : "Unexpected error",
        500,
      );
    }
  },
);

// Delete a collection by ID
app.delete(
  "/v0/collections/:id",
  zValidator("param", z.object({ id: z.number() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    try {
      await db.delete(collections).where(eq(collections.id, id));
      await db.delete(collectionsAppRoutes).where(eq(collectionsAppRoutes.collectionId, id));
      return ctx.json({ message: "Collection deleted" });
    } catch (error) {
      return ctx.json(
        error instanceof Error ? error.message : "Unexpected error",
        500,
      );
    }
  },
);

export default app;
