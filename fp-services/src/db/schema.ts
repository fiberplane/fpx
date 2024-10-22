import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// Define the "users" table schema for D1 (SQLite)
export const usersTable = sqliteTable(
  "users",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    githubUsername: text("github_username").notNull(), // GitHub username
    email: text("email").notNull(), // User email
    aiRequestCredits: integer("ai_request_credits").notNull().default(0), // New column for AI credits
    createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    // Adding unique constraints for githubUsername and email
    githubUsernameUnique: unique().on(table.githubUsername),
    // emailUnique: unique().on(table.email),
  }),
);

export type User = typeof usersTable.$inferSelect;
