import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { Bindings, Variables } from "@/lib/types";
import { cors } from "hono/cors";
import { Octokit } from "octokit";
import { Endpoints } from "@octokit/types";

export type ResponseGithubIssues =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];

export type GithubIssue = ResponseGithubIssues["data"][number];

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
  zValidator("param", z.string()),
  async (ctx) => {

	},
);

export default app;
