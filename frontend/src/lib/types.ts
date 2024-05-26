import type { Endpoints } from "@octokit/types";

export type GitHubResponse =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];

type GitHubIssues = GitHubResponse["data"];

export type GitHubIssue = GitHubIssues[number] extends undefined
  ? never
  : GitHubIssues[number];

// TODO: share this with the backend
export type Dependency = {
  name: string;
  version: string;
  repository: {
    owner: string;
    repo: string;
    url: string;
  };
};
