import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

export const geese = sqliteTable("geese", {
  id: integer("id", { mode: "number" }).primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
