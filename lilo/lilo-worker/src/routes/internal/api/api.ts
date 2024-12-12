import { Hono } from "hono";
import { cors } from "hono/cors";
import { dashboardAuthentication } from "../../../lib/session-auth";
import type { AppType } from "../../../types";
import { apiKeysRouter } from "./api-keys";
import { projectsRouter } from "./projects";

const router = new Hono<AppType>()
  .use(
    "/*",
    cors({
      origin: "http://localhost:3005", // TODO - Make this origin dynamic
      credentials: true, // Important! for use with frontend
    }),
  )
  // Middleware to ensure the user is authenticated
  // TOOD - Figure out how to make this middleware validate that the currentUser is not null
  .use(dashboardAuthentication)
  .route("/projects", projectsRouter)
  .route("/api-keys", apiKeysRouter);

export { router as internalApiRouter };
