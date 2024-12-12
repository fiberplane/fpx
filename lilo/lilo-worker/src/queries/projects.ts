import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import type { DatabaseType } from "../types";

/**
 * List all projects for a user
 */
export const listProjects = async (db: DatabaseType, userId: string) => {
  return db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.userId, userId));
};

// TODO - Do we need to omit the `id`?
type NewProject = typeof schema.projects.$inferInsert;
type UpdateProject = Partial<NewProject>;

/**
 * Create a new project
 */
export const createProject = async (db: DatabaseType, project: NewProject) => {
  return db.insert(schema.projects).values(project).returning();
};

export const updateProject = async (
  db: DatabaseType,
  projectId: string,
  project: UpdateProject,
) => {
  return db
    .update(schema.projects)
    .set(project)
    .where(eq(schema.projects.id, projectId))
    .returning();
};

export const deleteProject = async (db: DatabaseType, projectId: string) => {
  return db.delete(schema.projects).where(eq(schema.projects.id, projectId));
};
