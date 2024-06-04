import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import type { Endpoints } from "@octokit/types";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// TYPES
// These are helper types from Octokit, which are used in the `githubIssues` table
type OctokitResponseGithubIssues =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];

type OctokitGithubIssue = OctokitResponseGithubIssues["data"][number];

// HELPFUL: https://orm.drizzle.team/docs/column-types/sqlite
export const mizuLogs = sqliteTable("mizu_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  level: text("level", { enum: ["error", "warning", "info", "debug"] }),
  timestamp: text("timestamp"),
  traceId: text("trace_id"),
  service: text("service"),
  message: text("message", { mode: "json" }),
  ignored: integer("ignored", { mode: "boolean" }).default(false),
  args: text("args", { mode: "json" }), // NOTE - Should only be present iff message is a string
  callerLocation: text("caller_location", { mode: "json" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const githubIssues = sqliteTable("github_issues", {
  id: integer("id", { mode: "number" }).primaryKey(),
  owner: text("owner", { mode: "text" }).notNull(),
  repo: text("repo", { mode: "text" }).notNull(),
  url: text("url", { mode: "text" }).notNull(),
  title: text("title", { mode: "text" }).notNull().default(""),
  body: text("body", { mode: "text" }),
  state: text("state", {
    mode: "text",
    enum: ["open", "closed"],
  }).notNull(),
  labels: text("labels", { mode: "json" }).$type<
    OctokitGithubIssue["labels"]
  >(),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
  closedAt: text("closed_at"),
});

// GitHub might return an object or a string for the labels field so I'm just
// normalizing it all to a string array
const normalizeLabels = {
  labels: z.array(
    z.union([
      z.string().transform((labelString) => labelString),
      z
        .object({ name: z.string() })
        .transform((labelObject) => labelObject.name),
    ]),
  ),
};

export const newGithubIssueSchema = createInsertSchema(
  githubIssues,
  normalizeLabels,
);
export const githubIssueSchema = createSelectSchema(
  githubIssues,
  normalizeLabels,
);

// When you create an issue record
export type NewGitHubIssue = z.infer<typeof newGithubIssueSchema>;
// When you select an issue record
export type GitHubIssue = z.infer<typeof githubIssueSchema>;

// When you select a record
export type MizuLog = typeof mizuLogs.$inferSelect; // return type when queried
// When you create a record
export type NewMizuLog = typeof mizuLogs.$inferInsert; // insert type
