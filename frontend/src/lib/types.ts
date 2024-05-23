import type { Endpoints } from "@octokit/types";

export type GitHubIssues =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"]["data"];

export type GitHubIssue = GitHubIssues[number] extends undefined ? never : GitHubIssues[number]
