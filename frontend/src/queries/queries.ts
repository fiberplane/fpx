import {
  QueryClient,
  QueryClientProvider,
  QueryFunctionContext,
  useQuery,
} from "@tanstack/react-query";

import { DependenciesSchema, GitHubIssuesSchema } from "./types";

export const queryClient = new QueryClient();
export { QueryClientProvider };

export const MIZU_TRACES_KEY = "mizuTraces";

export function useRelevantIssues(traceId: string) {
  return useQuery({
    queryKey: ["relevantIssues", traceId],
    queryFn: fetchRelevantIssues,
  });
}

async function fetchRelevantIssues(
  context: QueryFunctionContext<[string, string]>,
) {
  const traceId = context.queryKey[1];
  try {
    const response = await fetch(`/v0/relevant-issues/${traceId}`, {
      mode: "cors",
    });
    const data = await response.json();
    return GitHubIssuesSchema.parse(data);
  } catch (e: unknown) {
    console.error("Error fetching GitHub issue for a trace: ", e);
    throw e;
  }
}

export function useDependencies() {
  return useQuery({
    queryKey: ["dependencies"],
    queryFn: fetchDependencies,
  });
}

async function fetchDependencies() {
  try {
    const response = await fetch("/v0/dependencies", {
      mode: "cors",
    });

    const data = await response.json();
    return DependenciesSchema.parse(data);
  } catch (e: unknown) {
    console.error("Error fetching dependencies: ", e);
    throw e;
  }
}

export function useGitHubIssues(owner: string, repo: string) {
  return useQuery({
    queryKey: ["githubIssues", owner, repo],
    queryFn: fetchGitHubIssues,
  });
}

async function fetchGitHubIssues(
  context: QueryFunctionContext<[string, string, string]>,
) {
  const owner = context.queryKey[1];
  const repo = context.queryKey[2];
  try {
    const response = await fetch(`/v0/github-issues/${owner}/${repo}`, {
      mode: "cors",
    });

    const data = await response.json();
    return GitHubIssuesSchema.parse(data);
  } catch (e: unknown) {
    console.error("Error fetching GitHub issues: ", e);
    throw e;
  }
}
