import { Hono } from "hono";
import createTokensApiRoutes from "./tokens.js";
import createTracesApiRoute from "./traces.js";
import workflows from "./workflow.js";

export default function createApiRoutes(apiKey: string, fpxEndpoint?: string) {
  const app = new Hono();

  app.route("/workflow", workflows);
  app.route("/tokens", createTokensApiRoutes(apiKey));
  app.route("/traces", createTracesApiRoute(fpxEndpoint));

  return app;
}
