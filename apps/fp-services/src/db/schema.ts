import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// Define the "users" table schema for D1 (SQLite)
export const users = sqliteTable(
  "users",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    githubUsername: text("github_username").notNull(),
    email: text("email").notNull(),
    aiRequestCredits: integer("ai_request_credits").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    // Adding unique constraint for githubUsername
    githubUsernameUnique: unique().on(table.githubUsername),
  }),
);

export type User = typeof users.$inferSelect;
