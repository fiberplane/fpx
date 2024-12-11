import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Next } from "hono";

import * as schema from "../db/schema";
import type { User } from "../db/schema";
import type { AppContext, DatabaseType } from "../types";

/**
 * Middleware to add the database to the context
 */
export const dbMiddleware = async (c: AppContext, next: Next) => {
  const db = drizzle(c.env.DB);
  c.set("db", db);
  await next();
};

/**
 * Get a user by their ID
 */
export const getUserById = async (
  db: DatabaseType,
  id: string,
): Promise<User | null> => {
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, id));
  return user ?? null;
};
