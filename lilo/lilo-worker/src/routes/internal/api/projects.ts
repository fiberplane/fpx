import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { AppType } from "../../../types";
import { createProject, listProjects, updateProject } from "../../../queries";

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  spec: z.string().min(1, "Specification is required"),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
});

export type ProjectsRouter = typeof projectsRouter;

const projectsRouter = new Hono<AppType>()
  .get("/", async (c) => {
    const db = c.get("db");
    const userId = c.get("currentUser")?.id ?? "";

    const projects = await listProjects(db, userId);

    return c.json(projects);
  })
  .post("/", zValidator("json", CreateProjectSchema), async (c) => {
    const db = c.get("db");
    const { name, spec } = c.req.valid("json");
    // TODO - How do we validate that the currentUser is logged in?
    const userId = c.get("currentUser")?.id ?? "";

    const newProject = await createProject(db, { name, spec, userId });

    return c.json(newProject, 201);
  })
  .patch("/:id", zValidator("json", UpdateProjectSchema), async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const { name } = c.req.valid("json");

    const updatedProject = await updateProject(db, id, { name });

    return c.json(updatedProject);
  });

export { projectsRouter };
