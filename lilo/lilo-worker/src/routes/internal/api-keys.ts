import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import * as schema from "../../db/schema";
import { dashboardAuthentication } from "../../lib/session-auth";
import type { AppType } from "../../types";

// TODO: Define the JWT secret key
const secretKey = "your-secret-key"; // Use a secure key from your environment

const router = new Hono<AppType & { Variables: JwtVariables }>();

type CreateApiKeyBody = {
  name: string;
};

router.use(dashboardAuthentication);

router.post("/", async (c) => {
  const db = c.get("db");
  const { name } = await c.req.json<CreateApiKeyBody>();

  // Define the payload with user information
  const payload = {
    name,
    createdBy: "user@example.com", // Get from auth context
    createdAt: new Date().toISOString(),
  };

  // Generate a JWT - TODO
  const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

  return c.json(
    { token, name, createdAt: payload.createdAt, createdBy: payload.createdBy },
    201,
  );
});

// Middleware to protect routes
router.use("/protected/*", jwt({ secret: secretKey }));

router.get("/protected/data", (c) => {
  const payload = c.get("jwtPayload");
  return c.json(payload);
});

router.get("/", async (c) => {
  const db = c.get("db");
  const apiKeys = await db.select().from(schema.apiKeys);

  // Transform the DB results to match the expected response format
  const formattedKeys = apiKeys.map((key) => ({
    token: key.key,
    name: key.id, // You might want to add a name field to your schema
    createdAt: key.createdAt,
    createdBy: key.userId,
  }));

  return c.json(formattedKeys);
});

router.delete("/:token", async (c) => {
  const db = drizzle(c.env.DB);
  const token = c.req.param("token");

  // TODO: Implement API key revocation logic
  return c.body(null, 204);
});

export { router as apiKeysRouter };
