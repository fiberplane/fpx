import { Hono } from "hono";
import { FpService } from "../../services/index.js";
import { z } from "zod";

// Temporary implementation
export default function createTokensApiRoute(apiKey: string) {
  const app = new Hono();

  const service = new FpService({ apiKey });

  app.put("/", async (c) => {
    const requestBody = await c.req.json();
    const { metadata } = z.object({ metadata: z.string() }).parse(requestBody);
    const response = await service.tokens.createToken(metadata);
    return c.json(response);
  });

  app.post("/verify", async (c) => {
    const requestBody = await c.req.json();
    const { token } = z.object({ token: z.string() }).parse(requestBody);
    const response = await service.tokens.verifyToken(token);
    return c.json(response);
  });

  app.delete("/revoke", async (c) => {
    const requestBody = await c.req.json();
    const { token } = z.object({ token: z.string() }).parse(requestBody);
    const response = await service.tokens.revokeToken(token);
    return c.json(response);
  });

  return app;
}
