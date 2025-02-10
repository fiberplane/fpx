import { Hono } from "hono";
import createAssistantApiRoute from "./assistant.js";
import createReportsApiRoute from "./reports.js";
import createTokensApiRoute from "./tokens.js";
import createTracesApiRoute from "./traces.js";
import createWorkflowsApiRoute from "./workflows.js";
import {FiberplaneAppType} from "../../types.js";

export default function createApiRoutes(apiKey: string, fpxEndpoint?: string) {
  const app = new Hono<FiberplaneAppType>();

  app.route("/workflows", createWorkflowsApiRoute(apiKey));
  app.route("/tokens", createTokensApiRoute(apiKey));
  app.route("/traces", createTracesApiRoute(fpxEndpoint));
  app.route("/reports", createReportsApiRoute(apiKey));
  app.route("/assistant", createAssistantApiRoute(apiKey));

  return app;
}
