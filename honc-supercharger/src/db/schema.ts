// import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const history = sqliteTable("history", {
  id: integer("id", { mode: "number" }).primaryKey(),
  description: text("description", { mode: "text" }),
  data: text("data", { mode: "json" }),
});

export const historySelectSchema = createSelectSchema(history);
export const historyInsertSchema = createInsertSchema(history);

export type History = z.infer<typeof historySelectSchema>;
export type NewHistory = z.infer<typeof historyInsertSchema>;
