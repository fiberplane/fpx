import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Next } from "hono";
import { getSignedCookie, setSignedCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import * as schema from "../db/schema";
import type { User } from "../db/schema";
import type { AppContext, DatabaseType } from "../types";

// Cookie config
const EXPIRATION_TIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const COOKIE_MAX_AGE = Math.floor(EXPIRATION_TIME_MS / 1000);

export const SESSION_COOKIE_NAME = "sid";

export const requireSessionSecret = (c: AppContext, next: Next) => {
  const sessionSecret = c.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new HTTPException(500, {
      message: "Internal server error (CODE: OMG_001)",
    });
  }
  return next();
};

/**
 * Create a session for a user
 * - Adds session to database
 * - Sets signed session cookie
 */
export const createSession = async (
  c: AppContext,
  db: DatabaseType,
  userId: string,
) => {
  const sessionToken = randomUUID();
  await db.insert(schema.sessions).values({
    userId,
    id: sessionToken,
    expiresAt: new Date(Date.now() + EXPIRATION_TIME_MS).toISOString(),
  });

  // Set session cookie with the session token
  setSignedCookie(c, SESSION_COOKIE_NAME, sessionToken, c.env.SESSION_SECRET, {
    httpOnly: true,
    secure: true,
    // TODO: change to none if possible in dev mode to support cross-origin auth with spa
    sameSite: "none",
    path: "/",
    // TODO: change to lilo.fp.dev when in prod
    // domain: "localhost",
    maxAge: COOKIE_MAX_AGE,
  });
};

export const deleteSession = async (c: AppContext, db: DatabaseType) => {
  const sessionId = await getSessionId(c);

  if (!sessionId) {
    return;
  }

  await db.delete(schema.sessions).where(eq(schema.sessions.id, sessionId));
};

/**
 * Middleware to add the current user to the context
 * - If no session cookie is found, sets `currentUser` to null
 * - If session cookie is found, but user is not found, sets `currentUser` to null
 * - If session cookie is found, and user is found, sets `currentUser` on context
 */
export const addCurrentUserToContext = async (c: AppContext, next: Next) => {
  const db = c.get("db");

  let sessionId: string | false | undefined;
  try {
    sessionId = await getSignedCookie(
      c,
      c.env.SESSION_SECRET,
      SESSION_COOKIE_NAME,
    );
  } catch (e) {
    sessionId = undefined;
  }

  if (!sessionId) {
    c.set("currentUser", null);
    return next();
  }

  const user = await getUserBySessionId(db, sessionId);

  c.set("currentUser", user);

  await next();
};

/**
 * Middleware to authenticate a user by session cookie
 * - If no session cookie is found, returns 401 Unauthorized
 * - If session cookie is found, but user is not found, returns 401 Unauthorized
 * - If session cookie is found, and user is found, sets `currentUser` on context
 */
export const dashboardAuthentication = async (c: AppContext, next: Next) => {
  const db = c.get("db");

  const sessionId = await getSessionId(c);

  if (!sessionId) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  const user = await getUserBySessionId(db, sessionId);

  if (!user) {
    return c.json({ message: "Unauthorized" }, 401);
  }

  c.set("currentUser", user);

  await next();
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

export const getSessionId = async (c: AppContext) => {
  return await getSignedCookie(c, c.env.SESSION_SECRET, SESSION_COOKIE_NAME);
};
