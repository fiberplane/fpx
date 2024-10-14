import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { FPX_PORT } from "../constants.js";
import * as schema from "../db/schema.js";
import { verifyToken } from "../lib/auth/auth.js";
import { getAuthServer } from "../lib/auth/server.js";
import { TokenPayloadSchema } from "../lib/auth/types.js";
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
 * Delete user info (effectively "logout")
 * @TODO - Make an authenticated request to remove the user from Fiberplane Services.
 * @NOTE - This won't delete the user from our OAuth app with GitHub.
 */
app.delete("/v0/auth/user", cors(), async (ctx) => {
  logger.debug("Deleting user details");
  const db = ctx.get("db");
  await db.delete(schema.tokens);
  // TODO - Make a request to Fiberplane Services to remove user from our D1 db
  return ctx.body(null, 204);
});

/**
 * Begin background server to handle user login
 */
app.post("/v0/auth/login-start", cors(), async (ctx) => {
  logger.debug("Login starting");
  await getAuthServer(FPX_PORT);
  // TODO - Set timeout to kill server?
  return ctx.json({ message: "Initialized auth server" });
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
app.post(
  "/v0/auth/success",
  cors(),
  zValidator("json", TokenPayloadSchema),
  async (ctx) => {
    const { token } = ctx.req.valid("json");

    const db = ctx.get("db");
    const wsConnections = ctx.get("wsConnections");

    try {
      await db.insert(schema.tokens).values({
        value: token,
      });

      // Force the UI to refresh user information,
      // effectively logging the user in.
      if (wsConnections) {
        for (const ws of wsConnections) {
          ws.send(
            JSON.stringify({
              event: "login_success",
              payload: ["userInfo"],
            }),
          );
        }
      }

      // TODO - Upsert token?
      logger.debug("NYI NYI NYI");
      return ctx.text("OK");
    } catch (error) {
      logger.error("Error handling auth success message:", error);
      return ctx.text("Unknown error", 500);
    }
  },
);

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
