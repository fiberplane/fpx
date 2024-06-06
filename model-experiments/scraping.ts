import { Octokit } from "@octokit/core";
import { throttling } from "@octokit/plugin-throttling";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import type { GetResponseDataTypeFromEndpointMethod } from "@octokit/types";
import fs from "node:fs";

const PatchedOctokit = Octokit.plugin(
  throttling,
  restEndpointMethods,
  paginateRest,
);

const octokit = new PatchedOctokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      octokit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`,
      );
      if (retryCount < 1) {
        console.log(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (_retryAfter, options, octokit) => {
      octokit.log.warn(
        `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
      );
    },
  },
});

type GithubIssue = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.rest.issues.listForRepo
>[number];

const REPOS = [
  {
    owner: "honojs",
    repo: "hono",
  },
  {
    owner: "honojs",
    repo: "middleware",
  },
  {
    owner: "neondatabase",
    repo: "serverless",
  },
  {
    owner: "drizzle-team",
    repo: "drizzle-orm",
  },
  {
    owner: "drizzle-team",
    repo: "drizzle-kit-mirror",
  },
  {
    owner: "cloudflare",
    repo: "workers-sdk",
  },
];

let fetchingInProgress = false;

async function fetchIssues(owner: string, repo: string) {
  fetchingInProgress = true;
  console.log(`Fetching issues for ${owner}/${repo}`);
  const iterator = octokit.paginate.iterator(
    "GET /repos/{owner}/{repo}/issues?state=all",
    {
      owner,
      repo,
      since: "2022-09-01", // NOTE: arbitrary date should probably revisit
      per_page: 100,
    },
  );

  let issues: GithubIssue[] = [];

  for await (const page of iterator) {
    issues = issues.concat(page.data as GithubIssue[]);
  }

  const fileName = `${owner}-${repo}.json`;

  console.log(`Fetched ${issues.length} issues for ${owner}/${repo}`);
  console.log(`Writing ${issues.length} issues to file ${fileName}`);
  fs.writeFileSync(fileName, JSON.stringify(issues));
  return { [`${owner}/${repo}`]: issues };
}

const ISSUES = [];

for (const { owner, repo } of REPOS) {
  try {
    const issuesByRepo = await fetchIssues(owner, repo);
    ISSUES.push(issuesByRepo);
  } catch (error) {
    console.error(`Error fetching issues for ${owner}/${repo}`, error);
  }
}
