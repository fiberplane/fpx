import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import * as jose from "jose";
import { z } from "zod";
import * as schema from "../../../db/schema";
import { importKey } from "../../../lib/crypto";
import { createJwtPayload } from "../../../lib/jwt";
import type { AppContext, AppType } from "../../../types";

const createApiKeyBodySchema = z.object({
  name: z.string(),
});

export type ApiKeysRouter = typeof apiKeysRouter;

const apiKeysRouter = new Hono<AppType>()
  .get("/", getApiKeys)
  // NOTE - `client.index[":id"].$delete` did not work on the Hono RPC client, so I added the "/keys" prefix
  .delete("/:id", deleteApiKey)
  // NOTE - We need to write this handler inline so that type inference works with zValidator and the `valid` property
  .post("/", zValidator("json", createApiKeyBodySchema), async (c) => {
    const db = c.get("db");
    const { name } = c.req.valid("json");

    // Get the authenticated user's information
    const user = c.get("currentUser");

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // We are going to sign the JWT using the private key from environment variables
    const privateKey = await importKey("private", c.env.PRIVATE_KEY);

    // Create a JWT payload
    const payload = createJwtPayload(user?.id);

    // Generate a JWT token bound to the user
    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: "PS256" })
      .sign(privateKey);

    // Store the API key in the database
    // TODO - Only store truncated token in the database?
    await db.insert(schema.apiKeys).values({
      key: token,
      userId: user.id,
      name,
    });

    return c.json(
      {
        token,
        name,
        // createdAt: payload.createdAt,
        createdBy: user.email,
      },
      201,
    );
  });

async function getApiKeys(c: AppContext) {
  const db = c.get("db");
  const apiKeys = await db.select().from(schema.apiKeys);

  // Transform the DB results to match the expected response format
  const formattedKeys = apiKeys.map((key) => ({
    id: key.id,
    token: maskToken(key.key),
    name: key.name,
    createdAt: key.createdAt,
    createdBy: key.userId,
  }));

  return c.json(formattedKeys, 200);
}

/**
 * Delete an API key for a user
 */
async function deleteApiKey(c: AppContext) {
  const db = c.get("db");
  const id = c.req.param("id");

  // Delete the API key from the database to revoke it
  // TODO - Mark the key as revoked instead of fully deleting the record
  await db.delete(schema.apiKeys).where(eq(schema.apiKeys.id, id));

  return c.body(null, 204);
}

/**
 * Mask the token to only show the first and last 4 characters
 */
const maskToken = (token: string) => {
  return `${token.slice(0, 4)}...${token.slice(-4)}`;
};

export { apiKeysRouter };
