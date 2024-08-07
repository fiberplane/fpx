import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { env } from "hono/adapter";
import { cors } from "hono/cors";
import { Octokit } from "octokit";
import { z } from "zod";
import { githubIssues, newGithubIssueSchema } from "../db/schema.js";
import * as schema from "../db/schema.js";
import type { Bindings, Variables } from "../lib/types.js";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get(
  "/v0/relevant-issues/:trace_id",
  cors(),
  zValidator("param", z.object({ trace_id: z.string() })),
  async (ctx) => {
    const { trace_id } = ctx.req.valid("param");

    const db = ctx.get("db");

    const relevantLogs = await db
      .select()
      .from(schema.mizuLogs)
      .where(eq(schema.mizuLogs.traceId, trace_id));

    let matchingIssueIds: number[] = [];
    for (const log of relevantLogs) {
      if (log.matchingIssues) {
        matchingIssueIds = [...matchingIssueIds, ...log.matchingIssues];
      }
    }

    // If there are no matchingIssueId's we can return early
    if (matchingIssueIds.length === 0) {
      return ctx.json([]);
    }

    const relevantIssues = z
      .array(schema.githubIssueSchema)
      .default([])
      .safeParse(
        await db
          .select()
          .from(schema.githubIssues)
          .where(inArray(schema.githubIssues.id, matchingIssueIds)),
      );

    if (relevantIssues.error) {
      console.log(
        "Error parsing relevant issues from db",
        relevantIssues.error,
      );
      throw new Error(relevantIssues.error.message);
    }

    return ctx.json(relevantIssues.data);
  },
);

/**
 * You can run `npm run db:seed` to avoid slamming the GitHub API locally.
 */
app.get(
  "/v0/github-issues/:owner/:repo",
  cors(),
  zValidator("param", z.object({ owner: z.string(), repo: z.string() })),
  async (ctx) => {
    const { owner, repo } = ctx.req.valid("param");

    const db = ctx.get("db");

    const githubToken = parseGitHubTokenIfExists(env(ctx).GITHUB_TOKEN);

    const issues = await getGitHubIssues(owner, repo, githubToken, db);

    return ctx.json(issues);
  },
);

/**
 * Validate token if it is a string and throw error
 * Otherwise, return empty string.
 *
 * Allows us to not set a GITHUB_TOKEN and still make calls to the GitHub API...
 */
function parseGitHubTokenIfExists(token?: string) {
  const githubTokenSchema = z.string().min(1);

  if (token) {
    const githubTokenResult = githubTokenSchema.safeParse(token);

    if (githubTokenResult.error) {
      console.log("Error parsing github token", githubTokenResult.error);
      throw new Error(githubTokenResult.error.message);
    }

    return githubTokenResult.data;
  }

  return "";
}

async function getGitHubIssues(
  owner: string,
  repo: string,
  githubToken: string,
  db: LibSQLDatabase<typeof schema>,
) {
  console.log("Fetching issues for owner", owner, "and repo", repo);

  const issues = await db
    .select()
    .from(githubIssues)
    .where(and(eq(githubIssues.owner, owner), eq(githubIssues.repo, repo)));

  if (issues.length > 0) {
    console.log("Issues found in db, returning");
    return issues;
  }

  if (!issues) {
    // console.log("Error parsing issues from db", issues.error);
    throw new Error("Error parsing issues from db");
  }

  console.log("No issues found in db, fetching from github");

  // if the db is empty, we need to populate it with the issues from github
  //
  // const response = fs.readFileSync("./issues-cache.json", "utf8");
  const octokit = new Octokit({ auth: githubToken });

  const iterator = octokit.paginate.iterator(
    `GET /repos/${owner}/${repo}/issues?state=all`,
    {
      owner,
      repo,
      per_page: 100,
    },
  );

  const fetchedIssuesSchema = z.array(
    newGithubIssueSchema
      .extend({
        // extending the default schema to make sure we account for how the github api returns the data
        pull_request: z.object({}).nullish(),
        html_url: z.string().url(),
        created_at: z.string(),
        updated_at: z.string(),
        closed_at: z.string().nullable(),

        // need to define these as optional as github api doesn't return them
        owner: z.string().optional(),
        repo: z.string().optional(),
        type: z.string().optional(),
      })
      .transform(
        //	transforming the data to match the schema and discard the extra fields
        ({
          html_url,
          created_at,
          updated_at,
          closed_at,
          pull_request,
          ...issue
        }) => ({
          ...issue,
          owner: owner,
          repo: repo,
          url: html_url,
          createdAt: created_at,
          updatedAt: updated_at,
          closedAt: closed_at,
          type: pull_request ? ("pull_request" as const) : ("issue" as const),
        }),
      ),
  );

  let fetchedIssues: z.infer<typeof fetchedIssuesSchema> = [];

  for await (const response of iterator) {
    const fetchedPage = fetchedIssuesSchema.min(1).safeParse(response.data);

    if (fetchedPage.error) {
      console.log("Failed parsing fetched issues page");
      console.log(fetchedPage.error);
      continue;
    }

    if (fetchedPage.success) {
      fetchedIssues = [...fetchedIssues, ...fetchedPage.data];
      await db.insert(githubIssues).values(fetchedPage.data);
    }
  }

  return fetchedIssues;
}

export default app;
