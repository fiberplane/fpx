import { Hono } from "hono";
import { dashboardCors } from "../../../lib/cors";
import { dashboardAuthentication } from "../../../lib/session-auth";
import type { AppType } from "../../../types";
import { apiKeysRouter } from "./api-keys";
import { projectsRouter } from "./projects";

const router = new Hono<AppType>()
  .use("/*", dashboardCors)
  .use(dashboardAuthentication)
  .route("/projects", projectsRouter)
  .route("/api-keys", apiKeysRouter);

export { router as internalApiRouter };
