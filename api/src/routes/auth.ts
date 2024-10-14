import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "../db/schema.js";
import { verifyToken } from "../lib/auth.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Get user info
 */
app.get("/v0/auth/user", cors(), async (ctx) => {
  logger.debug("Getting user details");
  const db = ctx.get("db");
  const [user] = await db.select().from(schema.tokens);
  return ctx.json(user);
});

/**
 * Delete user info
 */
app.delete("/v0/auth/user", cors(), async (ctx) => {
  logger.debug("Deleting user details");
  const db = ctx.get("db");
  await db.delete(schema.tokens);
  return ctx.body(null, 204);
});

/**
 * Handle user login
 */
app.post("/v0/auth/login-start", cors(), async (ctx) => {
  // TODO: Implement login start logic
  logger.debug("Login starting");
  return ctx.json({ message: "Logged in" });
});

/**
 * Verify user authentication
 */
app.post("/v0/auth/verify", cors(), async (ctx) => {
  const token = ctx.req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return ctx.json({ error: "No token provided" }, 400);
  }

  try {
    await verifyToken(token);
    logger.debug("Verification successful");
    return ctx.json(true);
  } catch (error) {
    logger.error("Verification failed", error);
    return ctx.json({ error: "Verification failed" }, 401);
  }
});

/**
 * Handle successful authentication
 */
app.post("/v0/auth/success", cors(), async (ctx) => {
  // ...
  const _body = await ctx.req.json();
  // TODO - Upsert token?
  logger.debug("NYI NYI NYI");
  return ctx.text("OK");
});

/**
 * Complete the authentication process
 */
app.post("/v0/auth/complete", cors(), async (ctx) => {
  const authData = await ctx.req.json();
  logger.debug("Received authentication data", authData);

  // TODO: Store the authentication data or perform any necessary actions
  // For now, we'll just log it and return a success message

  return ctx.json({ message: "Authentication data received and processed" });
});

export default app;
