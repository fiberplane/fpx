import { Hono } from "hono";
import createTokensApiRoutes from "./tokens.js";

export default function createApiRoutes(apiKey: string) {
  const app = new Hono();

  app.route("/tokens", createTokensApiRoutes(apiKey));

  return app;
}
