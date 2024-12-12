import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
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
  avatarUrl: text("avatar_url"),
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
  name: text("name"),
  key: text("key").notNull(),
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
