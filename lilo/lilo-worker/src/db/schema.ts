import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text()
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
};

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  email: text("email").notNull().unique(),
  githubUsername: text("github_username").notNull(),
  allowed: integer("allowed", { mode: "boolean" }).notNull().default(false),
  avatarUrl: text("avatar_url"),
  ...timestamps,
});

export const allowedUsers = sqliteTable("allowed_users", {
  githubUsername: text("github_username").primaryKey(),
  ...timestamps,
});

export type User = typeof users.$inferSelect;

// For session based auth
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  ...timestamps,
});

export const projects = sqliteTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  spec: text("spec"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const prompts = sqliteTable("prompts", {
  id: text("id").primaryKey(),
  apiKeyId: text("api_key_id").notNull(),
  prompt: text("prompt").notNull(),
  workflowJson: text("workflow_json"),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const apiKeys = sqliteTable("api_keys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  name: text("name"),
  key: text("key").notNull(),
  ...timestamps,
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  apiKeys: many(apiKeys),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
}));

export const promptsRelations = relations(prompts, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [prompts.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  prompts: many(prompts),
}));
