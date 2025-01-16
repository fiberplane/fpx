import { OpenAPIHono } from "@hono/zod-openapi";
import { apiAuthenticate } from "../../lib/api-authenticate";
import type { AppType } from "../../types";
import { projectsRouter } from "./projects";
import { queriesRouter } from "./queries";

const router = new OpenAPIHono<AppType>();
router.use(apiAuthenticate);
router.route("/projects", projectsRouter);
router.route("/projects/:projectId/queries", queriesRouter);
router.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
});

export { router as externalApiRouter };
