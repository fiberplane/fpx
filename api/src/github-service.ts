import { Context } from "hono";
import { Issues } from "./types";
import fs from "node:fs/promises";
import { Octokit } from "octokit";
import { assert } from "./utils";
import { CACHE_FILE_NAME } from "./constants";

export async function getGithubIssues(
  token: string,
  owner: string,
  repo: string,
): Promise<Issues> {
  let issuesCache: Issues;

  try {
    issuesCache = JSON.parse((await fs.readFile(CACHE_FILE_NAME)).toString());

    if (issuesCache) {
      console.log("Returning issues from cache");
      return issuesCache;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Issues cache is corrupted, ignoring");
    }
  }

  const octokit = new Octokit({
    auth: token,
  });

  console.log("Fetching issues");

  const response = await octokit.paginate(
    `GET /repos/${owner}/${repo}/issues?state=all`,
    {
      owner,
      repo,
    },
  );

  assert(
    response,
    (val): val is Issues => {
      return Array.isArray(val) && "id" in val[0] && "repository_url" in val[0];
    },
    "unexpected payload received from GitHub",
  );

  console.log("Issues fetched, writing to cache and returning");
  await fs.writeFile(CACHE_FILE_NAME, JSON.stringify(response));

  return response;
}
