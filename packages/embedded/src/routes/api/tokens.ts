import { Hono } from "hono";
import { z } from "zod";
import { FpService } from "../../services/index.js";
import { type FiberplaneAppType, logIfDebug } from "../../types.js";

// Temporary implementation
export default function createTokensApiRoute(apiKey: string) {
  const app = new Hono<FiberplaneAppType>();

  const service = new FpService({ apiKey });

  app.get("/", async (c) => {
    logIfDebug(c, "[tokens]", "- GET / -");
    c.json({ lol: "broek" });
  });

  app.put("/", async (c) => {
    logIfDebug(c, "[tokens]", "- PUT / -");
    const requestBody = await c.req.json();
    const { metadata } = z.object({ metadata: z.string() }).parse(requestBody);
    const response = await service.tokens.createToken(metadata);
    logIfDebug(c, "[tokens]", "- PUT / -", "Token generated:", response);
    return c.json(response);
  });

  app.post("/verify", async (c) => {
    logIfDebug(c, "[tokens]", "- POST /verify -");
    const requestBody = await c.req.json();
    const { token } = z.object({ token: z.string() }).parse(requestBody);
    const response = await service.tokens.verifyToken(token);
    logIfDebug(c, "[tokens]", "- POST /verify -", "Token verified:", response);
    return c.json(response);
  });

  app.delete("/revoke", async (c) => {
    logIfDebug(c, "[tokens]", "- DELETE /revoke -");
    const requestBody = await c.req.json();
    const { token } = z.object({ token: z.string() }).parse(requestBody);
    const response = await service.tokens.revokeToken(token);
    logIfDebug(c, "[tokens]", "- DELETE /revoke -", "Token revoked:", response);
    return c.json(response);
  });

  return app;
}
