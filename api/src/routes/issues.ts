import { githubIssues, newGithubIssueSchema } from "@/db/schema";
import * as schema from "@/db/schema";
import type { Bindings, Variables } from "@/lib/types";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Octokit } from "octokit";
import { z } from "zod";

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

app.get(
  "/v0/github-issues/:owner/:repo",
  cors(),
  zValidator("param", z.object({ owner: z.string(), repo: z.string() })),
  async (ctx) => {
    const { owner, repo } = ctx.req.valid("param");

    const db = ctx.get("db");

    const githubTokenSchema = z.string().min(1);
    const githubToken = githubTokenSchema.parse(
      ctx.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN,
    );

    const issues = await getGitHubIssues(owner, repo, githubToken, db);
    return ctx.json(issues);
  },
);

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

  const response = await octokit.paginate(
    `GET /repos/${owner}/${repo}/issues?state=all`,
    {
      owner,
      repo,
    },
  );

  const fetchedIssues = z
    .array(
      newGithubIssueSchema
        .extend({
          // making sure we always record the owner and repo
          owner: z.string().default(owner),
          repo: z.string().default(repo),
          // We only care if the object exists not whatever's inside it
          pullRequest: z.object({}).passthrough().nullish(),
          html_url: z.string().url(),
        })
        .transform((issue) => ({ ...issue, url: issue.html_url })),
    )
    .min(1)
    .safeParse(response);

  if (fetchedIssues.success) {
    const filteredIssues = fetchedIssues.data.filter(
      (issue) => !issue.pullRequest,
    );
    await db.insert(githubIssues).values(filteredIssues);
    return filteredIssues;
  }

  console.log("Error fetching issues from github");
  throw new Error(fetchedIssues.error.message);
}

export default app;
