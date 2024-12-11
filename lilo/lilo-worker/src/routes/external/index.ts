import { OpenAPIHono } from "@hono/zod-openapi";
import { apiAuthenticate } from "../../lib/api-authenticate";
import type { AppType } from "../../types";
import { projectsRouter } from "./projects";
import { queriesRouter } from "./queries";

const router = new OpenAPIHono<AppType>()
  .use(apiAuthenticate)
  .route("/projects", projectsRouter)
  .route("/projects/:projectId/queries", queriesRouter);

export { router as externalApiRouter };
