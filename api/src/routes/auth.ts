import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "../db/schema.js";
import { getUser, verifyToken } from "../lib/fp-services/auth.js";
import { TokenPayloadSchema } from "../lib/fp-services/types.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Get user info (checks if there is a token for the user locally)
 */
app.get("/v0/auth/user", cors(), async (ctx) => {
  logger.debug("Getting user details");
  const db = ctx.get("db");
  const [token] = await db.select().from(schema.tokens);

  if (!token) {
    return ctx.json(null);
  }

  const user = await getUser(token.value);

  return ctx.json({
    ...user,
    token: token.value,
  });
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
 * Verify user JWT
 */
app.post("/v0/auth/verify", cors(), async (ctx) => {
  const token = ctx.req.header("Authorization")?.split(" ")?.[1];

  if (!token) {
    return ctx.json({ error: "No token provided" }, 400);
  }

  try {
    await verifyToken(token);
    logger.debug("Auth token verification successful");
    return ctx.json(true);
  } catch (error) {
    logger.error("Verification failed", error);
    return ctx.json({ error: "Verification failed" }, 401);
  }
});

/**
 * Handle successful authentication coming from our local background auth service
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

      return ctx.text("OK");
    } catch (error) {
      logger.error("Error handling auth success message:", error);
      return ctx.text("Unknown error", 500);
    }
  },
);

export default app;
