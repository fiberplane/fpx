import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { Next } from "hono";

import * as schema from "../db/schema";
import type { User } from "../db/schema";
import type { AppContext, DatabaseType } from "../types";

export const dbMiddleware = async (c: AppContext, next: Next) => {
  const db = drizzle(c.env.DB);
  c.set("db", db);
  await next();
};

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

export const getUserBySessionId = async (
  db: DatabaseType,
  sessionId: string,
): Promise<User | null> => {
  // First, find the session to get the user ID
  const [session] = await db
    .select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId));

  if (!session) {
    return null;
  }

  // Now, find the user by the user ID from the session
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.userId));

  return user ?? null;
};
