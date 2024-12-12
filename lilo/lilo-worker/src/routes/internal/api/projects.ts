import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { createProject, listProjects, updateProject } from "../../../queries";
import { deleteProject } from "../../../queries/projects";
import type { AppType } from "../../../types";

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
    // TODO - How do we validate that the currentUser is logged in?
    const userId = c.get("currentUser")?.id ?? "";

    const projects = await listProjects(db, userId);

    return c.json(projects);
  })
  .post("/", zValidator("json", CreateProjectSchema), async (c) => {
    const db = c.get("db");
    const { name, spec } = c.req.valid("json");
    // TODO - How do we validate that the currentUser is logged in?
    const userId = c.get("currentUser")?.id ?? "";
    console.log("userId", c.get("currentUser"), userId);
    const newProject = await createProject(db, { name, spec, userId });

    return c.json(newProject, 201);
  })
  .patch("/:id", zValidator("json", UpdateProjectSchema), async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");
    const { name } = c.req.valid("json");

    const updatedProject = await updateProject(db, id, { name });

    return c.json(updatedProject);
  })
  .delete("/:id", async (c) => {
    const db = c.get("db");
    const id = c.req.param("id");

    await deleteProject(db, id);

    return c.json({ message: "Project deleted" });
  });

export { projectsRouter };
