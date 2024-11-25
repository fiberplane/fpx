import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type NewUser = typeof users.$inferInsert;

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
