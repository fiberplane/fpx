import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppType } from "../../types";
import { projectsRouter } from "./projects";
import { queriesRouter } from "./queries";

const router = new OpenAPIHono<AppType>()
  .route("/projects", projectsRouter)
  .route("/projects/:projectId/queries", queriesRouter);

export { router as externalApiRouter };
