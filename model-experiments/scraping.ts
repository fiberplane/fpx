import { Octokit } from "https://esm.sh/@octokit/core@6.1.2?dts";
import { throttling } from "https://esm.sh/@octokit/plugin-throttling@9.3.0";
import { paginateRest } from "https://esm.sh/@octokit/plugin-paginate-rest@11.3.0";
import { restEndpointMethods } from "https://esm.sh/@octokit/plugin-rest-endpoint-methods@13.2.1";
import type { GetResponseDataTypeFromEndpointMethod } from "https://esm.sh/v135/@octokit/types@13.5.0";

const PatchedOctokit = Octokit.plugin(
  throttling,
  restEndpointMethods,
  paginateRest,
);

const octokit = new PatchedOctokit({
  auth: Deno.env.get("GITHUB_TOKEN"),
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
  Deno.writeTextFileSync(fileName, JSON.stringify(issues));
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

const handleExit = async () => {
  if (fetchingInProgress) {
    console.log("Waiting for fetch operations to complete...");
    while (fetchingInProgress) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("Fetch operations completed. Exiting...");
  } else {
    console.log("No fetch operations in progress. Exiting...");
  }
};

Deno.addSignalListener("SIGINT", handleExit);
Deno.addSignalListener("SIGTERM", handleExit);

setTimeout(() => {
  Deno.exit(0);
}, 1);
