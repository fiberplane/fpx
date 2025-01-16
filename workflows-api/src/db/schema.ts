import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Step } from "../workflows/arazzo.js";

export const oaiSchema = sqliteTable("oai_schema", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export const workflow = sqliteTable("workflow", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  summary: text("summary"),
  description: text("description"),
  oaiSchemaId: text("oai_schema_id").references(() => oaiSchema.id),
  arazzoSchema: text("arazzo_schema"),
  prompt: text("prompt").notNull(),
  steps: text("steps", { mode: "json" }).$type<Step[]>().notNull(),
  lastRunStatus: text("last_run_status", {
    enum: ["success", "pending", "error"],
  }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

// export const run = sqliteTable("run", {
//   id: text("id").primaryKey(),
//   workflowId: text("workflow_id").references(() => workflow.id),
//   status: text("status").notNull(),
//   createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
//     () => new Date(),
//   ),
//   updatedAt: integer("updated_at", { mode: "timestamp" })
//     .$defaultFn(() => new Date())
//     .$onUpdate(() => new Date()),
// });
