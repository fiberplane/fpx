import { zValidator } from "@hono/zod-validator";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import * as schema from "../db/schema.js";
import { hasValidAiConfig } from "../lib/ai/index.js";
import { getUser, verifyToken } from "../lib/fp-services/auth.js";
import { TokenExpiredError } from "../lib/fp-services/errors.js";
import { TokenPayloadSchema } from "../lib/fp-services/types.js";
import { getAllSettings, upsertSettings } from "../lib/settings/index.js";
import type { Bindings, Variables } from "../lib/types.js";
import logger from "../logger/index.js";
import { enableCodeAnalysis } from "../lib/code-analysis.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Get user info (checks if there is a token for the user locally)
 */
app.get("/v0/auth/user", cors(), async (ctx) => {
  const db = ctx.get("db");
  const [token] = await db
    .select()
    .from(schema.tokens)
    .orderBy(desc(schema.tokens.createdAt))
    .limit(1);

  if (!token) {
    return ctx.json(null);
  }

  try {
    const user = await getUser(token.value);

    if (!user) {
      await db
        .delete(schema.tokens)
        .where(eq(schema.tokens.value, token.value))
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          logger.error(
            "Error deleting token for user that was not found",
            errorMessage,
          );
        });
      return ctx.json(null);
    }

    return ctx.json({
      ...user,
      token: token.value,
      expiresAt: token.expiresAt,
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      logger.debug("Token expired, deleting from database");
      // NOTE - We catch errors so as not to throw if deletion fails
      await db
        .delete(schema.tokens)
        .where(eq(schema.tokens.value, token.value))
        .catch((error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          logger.error("Error deleting expired token:", errorMessage);
        });
    }
    return ctx.json(null);
  }
});

/**
 * Delete all tokens in the database (effectively "logout")
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
    if (error instanceof TokenExpiredError) {
      return ctx.json({ error: "Token expired", type: error.name }, 401);
    }
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
    const webhonc = ctx.get("webhonc");

    const { token, expiresAt } = ctx.req.valid("json");

    const db = ctx.get("db");
    const wsConnections = ctx.get("wsConnections");

    try {
      await db.insert(schema.tokens).values({
        value: token,
        expiresAt,
      });

      // HACK - We do two updates to settings when a user logs in
      //        1. If AI is not enabled, just switch to Fiberplane provider
      //        2. If proxy requests are not enabled, just enable them
      const settings = await getAllSettings(db);
      const aiEnabled = settings ? hasValidAiConfig(settings) : false;
      if (!aiEnabled) {
        await upsertSettings(db, {
          aiProvider: "fp",
          aiProviderConfigurations: {
            ...settings?.aiProviderConfigurations,
            fp: {
              model: "",
              apiKey: "",
            },
          },
        });
        // Need to enable code analysis after updating AI settings
        enableCodeAnalysis();
      }
      if (!settings?.proxyRequestsEnabled) {
        await upsertSettings(db, {
          proxyRequestsEnabled: true,
        });
        logger.debug(
          "Proxy requests enabled after logging in user, starting webhonc",
        );
        await webhonc.start();
      }

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
