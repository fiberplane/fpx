import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema";
import type { AppType } from "../../types";

const router = new OpenAPIHono<AppType>();

// Define schemas
const ProjectSchema = z
  .object({
    id: z.string().openapi({
      example: "proj_123",
      description: "Project ID",
    }),
    name: z.string().openapi({
      example: "My API Project",
      description: "Project name",
    }),
    userId: z.string().openapi({
      example: "user_123",
      description: "Owner's user ID",
    }),
  })
  .openapi("Project");

const CreateProjectSchema = z
  .object({
    name: z.string().openapi({
      example: "My API Project",
      description: "Name for the new project",
    }),
    spec: z.string().openapi({
      example: "openapi: 3.0.0\ninfo:\n  title: API",
      description: "OpenAPI specification content",
    }),
  })
  .openapi("CreateProject");

const listProjectsRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(ProjectSchema),
        },
      },
      description: "List of projects",
    },
  },
});

// Define routes
const createProjectRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateProjectSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Project created successfully",
    },
  },
});

const updateProjectRoute = createRoute({
  method: "patch",
  path: "/{id}",
  request: {
    params: z.object({
      id: z.string(),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ProjectSchema,
        },
      },
      description: "Project updated successfully",
    },
  },
});

// Implement handlers
router.openapi(createProjectRoute, async (c) => {
  const db = drizzle(c.env.DB);
  const { name, spec } = c.req.valid("json");
  const userId = c.get("currentUser")?.id ?? "";
  console.log(userId);
  const [newProject] = await db
    .insert(schema.projects)
    .values({ name, spec, userId })
    .returning();

  return c.json(newProject, 201);
});

router.openapi(updateProjectRoute, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.valid("param").id;
  const { name } = c.req.valid("json");

  const [updatedProject] = await db
    .update(schema.projects)
    .set({ name })
    .where(eq(schema.projects.id, id))
    .returning();

  return c.json(updatedProject);
});

router.openapi(listProjectsRoute, async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.get("currentUser")?.id ?? "";

  const projects = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.userId, userId));

  return c.json(projects);
});

// Add other project routes (API specs, documentation) following similar pattern...

export { router as projectsRouter };
