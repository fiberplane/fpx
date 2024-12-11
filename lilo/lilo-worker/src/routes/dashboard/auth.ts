import { randomUUID } from "node:crypto";
import { githubAuth } from "@hono/oauth-providers/github";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { setSignedCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import * as schema from "../../db/schema";
import { SESSION_COOKIE_NAME, createSession } from "../../lib/session-auth";
import type { AppType } from "../../types";

const router = new Hono<AppType>();

// NOTE - Never serve the auth routes if SESSION_SECRET is not set
router.use("/auth", async (c, next) => {
  if (!c.env.SESSION_SECRET) {
    return c.json({ error: "Internal server error" }, 500);
  }
  return next();
});

// Handle errors from GitHub OAuth
router.onError((err, c) => {
  if (err instanceof HTTPException) {
    if (err.status === 401) {
      return c.json({ error: "Authentication failed" }, 401);
    }
    return err.getResponse();
  }
  return c.json({ error: "Internal server error" }, 500);
});

// Set up GitHub OAuth middleware
router.use("/github", async (c, next) => {
  const handler = githubAuth({
    client_id: c.env.GITHUB_ID,
    client_secret: c.env.GITHUB_SECRET,
    scope: ["read:user", "user:email"],
    oauthApp: true,
  });
  return handler(c, next);
});

// GitHub OAuth callback handler
router.get("/github", async (c) => {
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

  // TODO - Redirect to the dashboard
  return c.redirect("/dashboard");
});

export { router as dashboardAuthRouter };
