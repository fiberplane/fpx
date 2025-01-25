import { Hono } from "hono";
import createTokensApiRoutes from "./tokens.js";
import workflows from "./workflow.js";

export default function createApiRoutes(apiKey: string) {
  const app = new Hono();

  app.route("/workflow", workflows);
  app.route("/tokens", createTokensApiRoutes(apiKey));
  return app;
}
