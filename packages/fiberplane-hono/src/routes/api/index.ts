import { type Env, Hono } from "hono";
import type { FiberplaneAppType } from "../../types.js";
import createAssistantApiRoute from "./assistant.js";
import createReportsApiRoute from "./reports.js";
import createTokensApiRoute from "./tokens.js";
import createTracesApiRoute from "./traces.js";
import createWorkflowsApiRoute from "./workflows.js";

export default function createApiRoutes<E extends Env>(
  apiKey: string,
  fpxEndpoint?: string,
) {
  const app = new Hono<E & FiberplaneAppType<E>>();

  app.route("/workflows", createWorkflowsApiRoute(apiKey));
  app.route("/tokens", createTokensApiRoute(apiKey));
  app.route("/traces", createTracesApiRoute(fpxEndpoint));
  app.route("/reports", createReportsApiRoute(apiKey));
  app.route("/assistant", createAssistantApiRoute(apiKey));

  return app;
}
