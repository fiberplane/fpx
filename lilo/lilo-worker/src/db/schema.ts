import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

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
  token: text("token"),
  refreshToken: text("refresh_token"),
  sessionToken: text("session_token"),
  ...timestamps,
});

export type User = typeof users.$inferSelect;

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
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const openAPISpecs = sqliteTable("open_api_specs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  spec: text("spec").notNull(),
  ...timestamps,
});

export const queries = sqliteTable("queries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  apiKeyId: text("api_key_id")
    .notNull()
    .references(() => apiKeys.id),
  query: text("query").notNull(),
  ...timestamps,
});

export const apiKeys = sqliteTable("api_keys", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  key: text("key").notNull(),
  ...timestamps,
});

export const documentation = sqliteTable("documentation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id),
  content: text("content").notNull(),
  type: text("type").notNull(),
  ...timestamps,
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  apiKeys: many(apiKeys),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  openAPISpecs: many(openAPISpecs),
}));

export const openAPISpecsRelations = relations(openAPISpecs, ({ one }) => ({
  project: one(projects, {
    fields: [openAPISpecs.projectId],
    references: [projects.id],
  }),
}));

export const queriesRelations = relations(queries, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [queries.apiKeyId],
    references: [apiKeys.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
  queries: many(queries),
}));
