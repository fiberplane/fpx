import { Hono } from "hono";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { Bindings, Variables } from "@/lib/types";
import { cors } from "hono/cors";
import {
  githubIssues,
  newGithubIssueSchema,
  githubIssueSchema,
} from "@/db/schema";
import { Octokit } from "octokit";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

import fs from "node:fs";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.get(
  "/v0/relevant-issues/:id",
  cors(),
  zValidator("param", z.string()),
  async (ctx) => {
    // TODO - get relevant issues for a given trace id
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

  const issues = z
    .array(githubIssueSchema)
    .min(1)
    .safeParse(
      await db
        .select()
        .from(githubIssues)
        .where(and(eq(githubIssues.owner, owner), eq(githubIssues.repo, repo))),
    );

  if (issues.success) {
    console.log("Issues found in db, returning");
    return issues.data;
  }

  if (
    issues.error &&
    !issues.error.isEmpty &&
    issues.error.errors[0].code !== "too_small"
  ) {
    // console.log("Error parsing issues from db", issues.error);
    throw new Error(issues.error.message);
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
      newGithubIssueSchema.extend({
        // making sure we always record the owner and repo
        owner: z.string().default(owner),
        repo: z.string().default(repo),
      }),
    )
    .min(1)
    .safeParse(response);

  if (fetchedIssues.success) {
    await db.insert(githubIssues).values(fetchedIssues.data);
    return fetchedIssues.data;
  }

  console.log("Error fetching issues from github");
  throw new Error(fetchedIssues.error.message);
}

export default app;
