import { useEffect, useState } from "react";
import { Endpoints } from "@octokit/types";

type Issue = Endpoints["GET /repos/{owner}/{repo}/issues"]["response"];

export function useIssues() {
  const [issues, setIssues] = useState([] as Array<Issue>);
	useEffect(() => {}, []);
  return { issues };
}
