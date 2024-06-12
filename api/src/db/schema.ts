import type { Endpoints } from "@octokit/types";
import { relations, sql } from "drizzle-orm";
import {
  blob,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// TYPES
// These are helper types from Octokit, which are used in the `githubIssues` table
type OctokitResponseGithubIssues =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];

type OctokitGithubIssue = OctokitResponseGithubIssues["data"][number];

// this is the template
export const appRoutes = sqliteTable(
  "app_routes",
  {
    path: text("path", { mode: "text" }),
    method: text("method", { mode: "text" }),
    handler: text("handler", { mode: "text" }),
  },
  (table) => {
    return {
      id: primaryKey({ name: "id", columns: [table.method, table.path] }),
    };
  },
);

export const appRoutesSelectSchema = createSelectSchema(appRoutes);
export const appRoutesInsertSchema = createInsertSchema(appRoutes);

export type AppRoute = z.infer<typeof appRoutesSelectSchema>;
export type NewAppRoute = z.infer<typeof appRoutesInsertSchema>;

// 1. get a request from the client: url, method, headers, body
// 2. construct the request object and persist it
// 3. we need to forward that request to our app server
// 4. get a response from the app server including the traceId
// 5. construct the response object and persist it
// 6. we need to forward that response to the client

type QueryParams = Record<string, string>;

export const appRequests = sqliteTable("app_requests", {
  id: integer("id", { mode: "number" }).primaryKey(),
  requestMethod: text("request_method", {
    mode: "text",
    enum: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "HEAD",
      "OPTIONS",
      "CONNECT",
      "TRACE",
    ],
  }).notNull(),
  requestUrl: text("request_url", { mode: "text" }).notNull(),
  requestHeaders: text("request_headers", { mode: "json" }).$type<
    Record<string, string>
  >(),
  requestQueryParams: text("request_query_params", { mode: "json" }),
  requestBody: text("request_body", { mode: "json" }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  // responseId: integer("response_id").references(() => appResponses.id),
});

export const appResponses = sqliteTable("app_responses", {
  id: integer("id", { mode: "number" }).primaryKey(),
  traceId: text("trace_id", { mode: "text" }).notNull(),
  responseStatusCode: integer("response_status_code", { mode: "number" }),
  responseTime: integer("response_time", { mode: "number" }),
  responseHeaders: text("response_headers", { mode: "json" }).$type<{
    [key: string]: string;
  }>(),
  responseBody: text("response_body", { mode: "text" }),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  requestId: integer("request_id").references(() => appRequests.id),
});

export const appResponseRelations = relations(appResponses, ({ one }) => ({
  requestId: one(appRequests, {
    fields: [appResponses.requestId],
    references: [appRequests.id],
  }),
}));

// Otherwise I have a generic `Json` type which is hard to work with
// TODO: probably could be reworked but this is stub anyway so who cares
const refineRequestObjects = {
  requestQueryParams: z.record(z.string()).optional(),
  requestBody: z.record(z.string(), z.any()).optional(),
  requestHeaders: z.record(z.string()).optional(),
};

export const appRequestSelectSchema = createSelectSchema(
  appRequests,
  refineRequestObjects,
);
export const appRequestInsertSchema = createInsertSchema(
  appRequests,
  refineRequestObjects,
);

export type AppRequest = z.infer<typeof appRequestSelectSchema>;
export type NewAppRequest = z.infer<typeof appRequestInsertSchema>;

export const appResponseSelectSchema = createSelectSchema(appResponses);
export const appResponseInsertSchema = createInsertSchema(appResponses);

export type AppResponse = z.infer<typeof appResponseSelectSchema>;
export type NewAppResponse = z.infer<typeof appResponseInsertSchema>;

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
  callerLocation: text("caller_location", { mode: "json" }).$type<
    z.infer<typeof CallerLocationSchema>
  >(),
  createdAt: text("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
  matchingIssues: text("matching_issues", { mode: "json" }).$type<
    number[] | null
  >(),
});

const CallerLocationSchema = z.object({
  file: z.string(),
  line: z.string(),
  column: z.string(),
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
  type: text("type", { enum: ["issue", "pull_request"] }).notNull(),
  labels: text("labels", { mode: "json" }).$type<
    OctokitGithubIssue["labels"]
  >(),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
  closedAt: text("closed_at"),
});

// Eventually this might be a separate table? Either way for now just keeping schemas
// in one place
export const dependencySchema = z.object({
  name: z.string(),
  version: z.string(),
  repository: z.object({
    owner: z.string(),
    repo: z.string(),
    url: z.string(),
  }),
});

export type Dependency = z.infer<typeof dependencySchema>;

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

export const newMizuLogSchema = createInsertSchema(mizuLogs);
export const mizuLogSchema = createSelectSchema(mizuLogs);

// When you select a record
export type MizuLog = typeof mizuLogs.$inferSelect; // return type when queried
// When you create a record
export type NewMizuLog = typeof mizuLogs.$inferInsert; // insert type
