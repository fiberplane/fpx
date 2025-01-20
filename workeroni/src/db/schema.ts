import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { WorkflowStep } from "../schemas/arazzo";

export const oaiSchema = sqliteTable("oai_schema", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export const workflow = sqliteTable("workflow", {
  workflowId: text("workflow_id").primaryKey(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  oaiSchemaId: text("oai_schema_id").references(() => oaiSchema.id).notNull(),
  steps: text("steps", { mode: "json" }).$type<WorkflowStep[]>().notNull(),
});
