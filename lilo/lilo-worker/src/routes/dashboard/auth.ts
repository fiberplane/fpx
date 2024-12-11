import { randomUUID } from "node:crypto";
import { githubAuth } from "@hono/oauth-providers/github";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import * as schema from "../../db/schema";
import { SESSION_COOKIE_NAME, createSession, deleteSession, getSessionId } from "../../lib/session-auth";
import type { AppType } from "../../types";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { cors } from "hono/cors";

export const dashboardAuthRouter = new OpenAPIHono<AppType>();

// NOTE - Never serve the auth routes if SESSION_SECRET is not set
dashboardAuthRouter.use("/auth", async (c, next) => {
  if (!c.env.SESSION_SECRET) {
    return c.json({ error: "Internal server error" }, 500);
  }
  return next();
});

// Handle errors from GitHub OAuth
dashboardAuthRouter.onError((err, c) => {
  if (err instanceof HTTPException) {
    if (err.status === 401) {
      return c.json({ error: "Authentication failed" }, 401);
    }
    return err.getResponse();
  }
  return c.json({ error: "Internal server error" }, 500);
});

// Set up GitHub OAuth middleware
dashboardAuthRouter.use("/github", async (c, next) => {
  const handler = githubAuth({
    client_id: c.env.GITHUB_ID,
    client_secret: c.env.GITHUB_SECRET,
    scope: ["read:user", "user:email"],
    oauthApp: true,
  });
  return handler(c, next);
});

// GitHub OAuth callback handler
dashboardAuthRouter.get("/github", async (c) => {
  const db = drizzle(c.env.DB);

  const user = c.get("user-github");

  // TODO - Show an HTML page with a message to the user
  if (!user?.login || !user?.email) {
    return c.json({ error: "No user information available" }, 401);
  }

  // Upsert the user in the database
  const [userRecord] = await db
    .insert(schema.users)
    .values({
      email: user.email,
      githubUsername: user.login,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: {
        githubUsername: user.login,
      },
    })
    .returning();

  // Generate a session and attach to cookie (stored in the database)
  await createSession(c, db, userRecord.id);
  console.log('created session')
  console.log("redirecting to", "http://localhost:3005/");
  // TODO - Redirect to the dashboard
  return c.redirect("http://localhost:3005/");
});

// Add session endpoint
dashboardAuthRouter.get("/session", cors({
  // FIXME - remove this when in prod
  origin: "http://localhost:3005",
  credentials: true,
}), async (c) => {
  const sessionId = await getSessionId(c);
  if (!sessionId) {
    return c.json({ message: "No session found" }, 401);
  }

  const db = c.get("db");
  const [result] = await db.select()
    .from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id));

  if (!result) {
    return c.json({ message: "Session not found" }, 401);
  }

  const session = result.sessions
  if (!session || new Date(session.expiresAt) < new Date()) {
    // Session expired or not found
    await deleteSession(c, db);
    return c.json({ message: "Session expired" }, 401);
  }

  return c.json(result.users);
});
