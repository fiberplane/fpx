import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Step } from "../schemas/index.js";

export const oaiSchema = sqliteTable("oai_schema", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  content: text("content").notNull(),
});

export const workflow = sqliteTable("workflow", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  oaiSchemaId: text("oai_schema_id").references(() => oaiSchema.id).notNull(),
  steps: text("steps", { mode: "json" }).$type<Step[]>().notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
