// import { useEffect, useState } from "react";
import { ISSUE_TABLE_ID } from "@/lib/constants";
import type { GitHubIssues } from "@/lib/types";
import type { Store } from "tinybase/store";

export async function loadIssues(store: Store, owner: string, repo: string) {
  try {
    const response = await fetch(
      `http://localhost:8788/v0/github-issues/${owner}/${repo}`,
      { mode: "cors" },
    );

    const issues: GitHubIssues = await response.json();

    store.transaction(() => {
      for (const issue of issues) {
        if (!issue) continue;
        //FIXME: need to remove null values in issue before proceeding
        store.setRow(ISSUE_TABLE_ID, issue.number.toString(), issue);
      }
    });
  } catch (error) {
    console.log(error);
  }
}
