import { Hono } from "hono";
import assistant from "./assistant.js";
import report from "./report.js";
import createTokensApiRoutes from "./tokens.js";
import createTracesApiRoute from "./traces.js";
import workflows from "./workflow.js";

export default function createApiRoutes(apiKey: string, fpxEndpoint?: string) {
  const app = new Hono();

  app.route("/workflows", workflows);
  app.route("/tokens", createTokensApiRoutes(apiKey));
  app.route("/traces", createTracesApiRoute(fpxEndpoint));
  app.route("/reports", report);
  app.route("/assistant", assistant);

  return app;
}
