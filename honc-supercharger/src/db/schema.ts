// import { relations, sql } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

/**
 * Probably needs a new name, but a "session" means a single interaction with the API,
 * which produces files
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  prompt: text("prompt", { mode: "text" }),
  data: text("data", { mode: "json" }),
  type: text("type", { mode: "text", enum: ["success", "error"] }).default(
    "success",
  ),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`),
});

export const sessionsSelectSchema = createSelectSchema(sessions);
export const sessionsInsertSchema = createInsertSchema(sessions);

export type Session = z.infer<typeof sessionsSelectSchema>;
export type NewSession = z.infer<typeof sessionsInsertSchema>;
