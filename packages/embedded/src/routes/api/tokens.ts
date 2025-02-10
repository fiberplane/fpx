import { Hono } from "hono";
import { z } from "zod";
import { FpService } from "../../services/index.js";
import {FiberplaneAppType, logIfDebug} from "../../types.js";

// Temporary implementation
export default function createTokensApiRoute(apiKey: string) {
  const app = new Hono<FiberplaneAppType>();

  const service = new FpService({ apiKey });

  app.get("/", async (c) => {
    logIfDebug(c.get("debug"), "tokens index was called (GET)");
    c.json({ lol: "broek" })
  });

  app.put("/", async (c) => {
    logIfDebug(c.get("debug"), "tokens index was called (PUT)");
    const requestBody = await c.req.json();
    const { metadata } = z.object({ metadata: z.string() }).parse(requestBody);
    const response = await service.tokens.createToken(metadata);
    logIfDebug(c.get("debug"), "Token generated:", response);
    return c.json(response);
  });

  app.post("/verify", async (c) => {
    logIfDebug(c.get("debug"), "token verify endpoint called");
    const requestBody = await c.req.json();
    const { token } = z.object({ token: z.string() }).parse(requestBody);
    const response = await service.tokens.verifyToken(token);
    logIfDebug(c.get("debug"), "Token verified:", response);
    return c.json(response);
  });

  app.delete("/revoke", async (c) => {
    logIfDebug(c.get("debug"), "token revoke endpoint called");
    const requestBody = await c.req.json();
    const { token } = z.object({ token: z.string() }).parse(requestBody);
    const response = await service.tokens.revokeToken(token);
    logIfDebug(c.get("debug"), "Token revoked:", response);
    return c.json(response);
  });

  return app;
}
