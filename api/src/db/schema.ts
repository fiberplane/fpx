import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";
import { GithubIssue } from "@/routes/issues";

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
  url: text("url", { mode: "text" }).notNull(),
  title: text("title", { mode: "text" }).notNull(),
  body: text("body", { mode: "text" }),
  state: text("state", { mode: "text" }).notNull(),
  labels: text("labels", { mode: "json" })
    .$type<GithubIssue["labels"][number]>()
    .notNull(),
  milestone: text("milestone", { mode: "json" }).$type<
    GithubIssue["milestone"]
  >(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
	closedAt: text("closed_at"),
});

type PR = GithubIssue["pull_request"];
type closed_at = GithubIssue["closed_at"];

export type RecordedGithubIssue = typeof githubIssues.$inferSelect;

// Github Issues response
// [
//   {
//     "id": 1,
//     "node_id": "MDU6SXNzdWUx",
//     "url": "https://api.github.com/repos/octocat/Hello-World/issues/1347",
//     "repository_url": "https://api.github.com/repos/octocat/Hello-World",
//     "labels_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/labels{/name}",
//     "comments_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/comments",
//     "events_url": "https://api.github.com/repos/octocat/Hello-World/issues/1347/events",
//     "html_url": "https://github.com/octocat/Hello-World/issues/1347",
//     "number": 1347,
//     "state": "open",
//     "title": "Found a bug",
//     "body": "I'm having a problem with this.",
//     "user": {
//     },
//     "labels": [
//       {
//       }
//     ],
//     "assignee": {
//     },
//     "assignees": [
//     ],
//     "milestone": {
//     },
//     "locked": true,
//     "active_lock_reason": "too heated",
//     "comments": 0,
//     "pull_request": {
//       "url": "https://api.github.com/repos/octocat/Hello-World/pulls/1347",
//       "html_url": "https://github.com/octocat/Hello-World/pull/1347",
//       "diff_url": "https://github.com/octocat/Hello-World/pull/1347.diff",
//       "patch_url": "https://github.com/octocat/Hello-World/pull/1347.patch"
//     },
//     "closed_at": null,
//     "created_at": "2011-04-22T13:33:48Z",
//     "updated_at": "2011-04-22T13:33:48Z",
//     "closed_by": {
//       "login": "octocat",
//       "id": 1,
//       "node_id": "MDQ6VXNlcjE=",
//       "avatar_url": "https://github.com/images/error/octocat_happy.gif",
//       "gravatar_id": "",
//       "url": "https://api.github.com/users/octocat",
//       "html_url": "https://github.com/octocat",
//       "followers_url": "https://api.github.com/users/octocat/followers",
//       "following_url": "https://api.github.com/users/octocat/following{/other_user}",
//       "gists_url": "https://api.github.com/users/octocat/gists{/gist_id}",
//       "starred_url": "https://api.github.com/users/octocat/starred{/owner}{/repo}",
//       "subscriptions_url": "https://api.github.com/users/octocat/subscriptions",
//       "organizations_url": "https://api.github.com/users/octocat/orgs",
//       "repos_url": "https://api.github.com/users/octocat/repos",
//       "events_url": "https://api.github.com/users/octocat/events{/privacy}",
//       "received_events_url": "https://api.github.com/users/octocat/received_events",
//       "type": "User",
//       "site_admin": false
//     },
//     "author_association": "COLLABORATOR",
//     "state_reason": "completed"
//   }
// ]

// When you select a record
export type MizuLog = typeof mizuLogs.$inferSelect; // return type when queried
// When you create a record
export type NewMizuLog = typeof mizuLogs.$inferInsert; // insert type
