import { zValidator } from "@hono/zod-validator";
import { and, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { CollectionItemParamsSchema } from "@fiberplane/fpx-types";
import {
  type NewCollection,
  appRoutes,
  collectionItems,
  collections,
} from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger/index.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.post(
  "/v0/collections",
  zValidator("json", z.object({ name: z.string() })),
  async (ctx) => {
    const db = ctx.get("db");

    const newCollection: NewCollection = ctx.req.valid("json");

    const [collection] = await db.transaction(async (db) => {
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

    return ctx.json(collection);
  },
);

app.post(
  "/v0/collections/:collectionId/items",
  zValidator(
    "param",
    z.object({ collectionId: z.number({ coerce: true }).int() }),
  ),
  zValidator(
    "json",
    CollectionItemParamsSchema.extend({
      appRouteId: z.number().int(),
    }),
  ),
  async (ctx) => {
    const db = ctx.get("db");

    const { collectionId } = ctx.req.valid("param");
    const { appRouteId, ...extraParams } = ctx.req.valid("json");
    const collectionItem = await db.transaction(async (db) => {
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

      const count = await db.$count(
        collectionItems,
        eq(collectionItems.collectionId, collectionId),
      );

      const [insertedItem] = await db
        .insert(collectionItems)
        .values({
          collectionId,
          appRouteId,
          ...extraParams,
          position: count,
        })
        .returning();

      return insertedItem;
    });

    return ctx.json(collectionItem);
  },
);

// Get all collections
app.get("/v0/collections", async (ctx) => {
  const db = ctx.get("db");
  const allCollections = await db.select().from(collections);
  const collectionWithRoutes = await Promise.all(
    allCollections.map(async (collection) => {
      const items = await db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, collection.id))
        .orderBy(collectionItems.position);
      return {
        ...collection,
        collectionItems: items.map(({ collectionId: _, ...item }) => item),
      };
    }),
  );
  return ctx.json(collectionWithRoutes);
});

// Get a single collection by ID
app.get(
  "/v0/collections/:id",
  zValidator("param", z.object({ id: z.number({ coerce: true }).int() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    const collection = await db.query.collections.findFirst({
      where: eq(collections.id, id),
      with: {
        collectionItems: true,
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
  },
);

// Update a collection by ID
app.put(
  "/v0/collections/:id",
  zValidator("param", z.object({ id: z.number({ coerce: true }).int() })),
  zValidator("json", z.object({ name: z.string() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    const updatedCollection = ctx.req.valid("json");
    await db
      .update(collections)
      .set(updatedCollection)
      .where(eq(collections.id, id));
    return ctx.json({ message: "Collection updated" });
  },
);

// Delete a collection by ID
app.delete(
  "/v0/collections/:id",
  zValidator("param", z.object({ id: z.number({ coerce: true }).int() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    await db.delete(collections).where(eq(collections.id, id));
    await db
      .delete(collectionItems)
      .where(eq(collectionItems.collectionId, id));
    return ctx.json({ message: "Collection deleted" });
  },
);

// Delete a collection item by ID
app.delete(
  "/v0/collections/:id/items/:itemId",
  zValidator(
    "param",
    z.object({
      id: z.number({ coerce: true }).int(),
      itemId: z.number({ coerce: true }).int(),
    }),
  ),
  async (ctx) => {
    const { id, itemId } = ctx.req.valid("param");
    const db = ctx.get("db");

    logger.debug(`Deleting collection item ${itemId} from collection ${id}`);

    await db
      .delete(collectionItems)
      .where(
        and(
          eq(collectionItems.collectionId, id),
          eq(collectionItems.id, itemId),
        ),
      );
    return ctx.json({ message: "Collection deleted" });
  },
);

// Updating a collection item by ID
app.put(
  "/v0/collections/:id/items/:itemId",
  zValidator(
    "param",
    z.object({
      id: z.number({ coerce: true }).int(),
      itemId: z.number({ coerce: true }).int(),
    }),
  ),
  zValidator("json", CollectionItemParamsSchema),
  async (ctx) => {
    const { id, itemId } = ctx.req.valid("param");
    const db = ctx.get("db");
    const { position, ...extraParams } = ctx.req.valid("json");

    await db.transaction(async (db) => {
      const item = await db.query.collectionItems.findFirst({
        where: and(
          eq(collectionItems.collectionId, id),
          eq(collectionItems.id, itemId),
        ),
      });

      if (!item) {
        throw new HTTPException(404, {
          message: "Collection item not found",
        });
      }

      await db
        .update(collectionItems)
        .set(extraParams)
        .where(
          and(
            eq(collectionItems.collectionId, id),
            eq(collectionItems.id, itemId),
          ),
        );
    });
    if (position !== undefined) {
      await updateCollectionItemOrder(db, id, itemId, position);
    }
    // TODO return updated item
    return ctx.body(null);
  },
);

async function updateCollectionItemOrder(
  db: Variables["db"],
  collectionId: number,
  itemId: number,
  newPosition: number,
) {
  // Get the current position of the item
  await db.transaction(async (db) => {
    const currentItem = await db.query.collectionItems.findFirst({
      where: eq(collectionItems.id, itemId),
    });

    if (!currentItem) {
      throw new HTTPException(404, {
        message: "Collection item not found",
      });
    }

    const currentPosition = currentItem.position;
    const totalItems = await db.$count(
      collectionItems,
      eq(collectionItems.collectionId, collectionId),
    );

    const position = newPosition < totalItems ? newPosition : totalItems - 1;

    // Update positions of other items
    if (position > currentPosition) {
      await db
        .update(collectionItems)
        .set({ position: sql`position - 1` })
        .where(
          and(
            eq(collectionItems.collectionId, collectionId),
            gt(collectionItems.position, currentPosition),
            lte(collectionItems.position, position),
          ),
        );
    } else if (position < currentPosition) {
      await db
        .update(collectionItems)
        .set({ position: sql`position + 1` })
        .where(
          and(
            eq(collectionItems.collectionId, collectionId),
            gte(collectionItems.position, newPosition),
            lt(collectionItems.position, currentPosition),
          ),
        );
    }

    // Update the position of the item
    await db
      .update(collectionItems)
      .set({ position: newPosition })
      .where(eq(collectionItems.id, itemId));
  });
}

export default app;
