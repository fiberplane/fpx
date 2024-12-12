import { githubAuth } from "@hono/oauth-providers/github";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import * as schema from "../../db/schema";
import {
  createSession,
  deleteSession,
  getSessionId,
} from "../../lib/session-auth";
import type { AppType } from "../../types";

export type DashboardAuthClient = typeof dashboardAuthRouter;

export const dashboardAuthRouter = new Hono<AppType>().get(
  "/session",
  async (c) => {
    const sessionId = await getSessionId(c);
    if (!sessionId) {
      return c.json({ message: "No session" }, 401);
    }

    const db = c.get("db");
    const [result] = await db
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, sessionId))
      .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id));

    if (!result) {
      return c.json({ message: "Session not found" }, 401);
    }

    const session = result.sessions;
    if (!session || new Date(session.expiresAt) < new Date()) {
      await deleteSession(c, db);
      return c.json({ message: "Session expired" }, 401);
    }

    return c.json(result.users);
  },
);

// NOTE - Never serve the auth routes if SESSION_SECRET is not set
dashboardAuthRouter.use("/auth", async (c, next) => {
  if (!c.env.SESSION_SECRET) {
    return c.json({ error: "Internal server error" }, 500);
  }
  return next();
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
  const db = c.get("db");
  const user = c.get("user-github");

  // TODO - Show an HTML page with a message to the user
  if (!user?.login || !user?.email) {
    return c.json({ error: "No user information available" }, 401);
  }

  const [allowedUser] = await db
    .select()
    .from(schema.allowedUsers)
    .where(eq(schema.allowedUsers.githubUsername, user.login))
    .limit(1);

  const allowed = !!allowedUser;

  // Upsert the user in the database
  const [userRecord] = await db
    .insert(schema.users)
    .values({
      email: user.email,
      githubUsername: user.login,
      allowed,
      avatarUrl: user.avatar_url,
    })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: {
        githubUsername: user.login,
        avatarUrl: user.avatar_url,
        allowed,
      },
    })
    .returning();

  // Generate a session and attach to cookie (stored in the database)
  await createSession(c, db, userRecord.id);

  // HACK - Redirect to the local SPA dashboard if we're in local mode
  if (c.env.LILO_ENV === "local") {
    return c.redirect("http://localhost:3005/");
  }
  return c.redirect("/");
});

// Logout handler
dashboardAuthRouter.get("/logout", async (c) => {
  await deleteSession(c, c.get("db"));
  return c.redirect("/");
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
