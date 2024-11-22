import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import {
  type NewGroup,
  appRoutes,
  // appRoutes,
  groups,
  groupsAppRoutes,
} from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const newGroupSchema = z.object({
  name: z.string(),
});

// Create a new group
app.post("/v0/groups", async (ctx) => {
  const db = ctx.get("db");

  const newCollection: NewGroup = newGroupSchema.parse(await ctx.req.json());

  try {
    const group = await db.transaction(async (db) => {
      const groupWithName = await db.query.groups.findFirst({
        where: eq(groups.name, newCollection.name),
      });
      if (groupWithName) {
        throw new HTTPException(400, {
          message: "Group name is not unique",
          cause: { name: "Group name is not unique" },
        });
      }

      return await db.insert(groups).values(newCollection).returning({
        id: groups.id,
        name: groups.name,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
      });
    });

    return ctx.json(group[0]);
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
  "/v0/groups/:groupId/app-routes",
  zValidator("param", z.object({ groupId: z.number({ coerce: true }) })),
  zValidator("json", z.object({ id: z.number() })),
  async (ctx) => {
    const db = ctx.get("db");

    const { groupId } = ctx.req.valid("param");
    const { id: appRouteId } = ctx.req.valid("json");

    try {
      const updatedGroup = await db.transaction(async (db) => {
        const group = db.query.groups.findFirst({
          where: eq(groups.id, groupId),
        });
        if (!group) {
          throw new HTTPException(404, {
            message: "Group not found",
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

        await db.insert(groupsAppRoutes).values({
          groupId,
          appRouteId,
        });

        return db.query.groups.findFirst({
          where: eq(groups.id, groupId),
          with: {
            groupsAppRoutes: {
              with: {
                appRoute: true,
              },
            },
          },
        });
      });

      return ctx.json(updatedGroup);
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

// Get all groups
app.get("/v0/groups", async (ctx) => {
  const db = ctx.get("db");

  try {
    const allGroups = await db.select().from(groups);
    const groupWithRoutes = await Promise.all(
      allGroups.map(async (group) => {
        const routes = await db
          .select()
          .from(groupsAppRoutes)
          .where(eq(groupsAppRoutes.groupId, group.id));
        return {
          ...group,
          appRoutes: routes.map((route) => route.appRouteId),
        };
      }),
    );
    return ctx.json(groupWithRoutes);
  } catch (error) {
    return ctx.json(
      error instanceof Error ? error.message : "Unexpected error",
      500,
    );
  }
});

// Get a single group by ID
app.get(
  "/v0/groups/:id",
  zValidator("param", z.object({ id: z.number() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    try {
      const group = await db.query.groups.findFirst({
        where: eq(groups.id, id),
        with: {
          groupsAppRoutes: true,
        },
      });
      if (!group) {
        throw new HTTPException(404, {
          message: "Collection not found",
        });
      }

      return ctx.json({
        ...group,
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

// Update a group by ID
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
        error instanceof Error ? error.message : "Unexpected error",
        500,
      );
    }
  },
);

// Delete a group by ID
app.delete(
  "/v0/groups/:id",
  zValidator("param", z.object({ id: z.number() })),
  async (ctx) => {
    const { id } = ctx.req.valid("param");
    const db = ctx.get("db");

    try {
      await db.delete(groups).where(eq(groups.id, id));
      await db.delete(groupsAppRoutes).where(eq(groupsAppRoutes.groupId, id));
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
