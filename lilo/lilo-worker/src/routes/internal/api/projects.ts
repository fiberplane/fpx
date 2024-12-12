import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { z } from "zod";
import * as schema from "../../../db/schema";
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
    const db = drizzle(c.env.DB);
    const userId = c.get("currentUser")?.id ?? "";

    const projects = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.userId, userId));

    return c.json(projects);
  })
  .post("/", zValidator("json", CreateProjectSchema), async (c) => {
    const db = drizzle(c.env.DB);
    const { name, spec } = c.req.valid("json");
    const userId = c.get("currentUser")?.id ?? "";

    const [newProject] = await db
      .insert(schema.projects)
      .values({ name, spec, userId })
      .returning();

    return c.json(newProject, 201);
  })
  .patch("/:id", zValidator("json", UpdateProjectSchema), async (c) => {
    const db = drizzle(c.env.DB);
    const id = c.req.param("id");
    const { name } = c.req.valid("json");

    const [updatedProject] = await db
      .update(schema.projects)
      .set({ name })
      .where(eq(schema.projects.id, id))
      .returning();

    return c.json(updatedProject);
  });

export { projectsRouter };
