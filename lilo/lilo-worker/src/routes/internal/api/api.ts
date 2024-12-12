import { Hono } from "hono";
import { cors } from "hono/cors";
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
  .route("/projects", projectsRouter)
  .route("/api-keys", apiKeysRouter);

export { router as internalApiRouter };
