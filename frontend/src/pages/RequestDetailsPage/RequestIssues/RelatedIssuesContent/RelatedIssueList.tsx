import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import { useRequestDetails } from "@/hooks";
import { MizuLog } from "@/queries";
import { useRelevantIssues } from "@/queries/queries";
import { useMemo } from "react";
import { RelatedIssueCard } from "./RelatedIssueCard";
import { getSignificantWords } from "./utils";

export function RelatedIssueList(props: { traceId: string }) {
  const { traceId } = props;
  const {
    data: issues,
    isLoading: issuesLoading,
    isError: issuesError,
  } = useRelevantIssues(traceId);
  const {
    trace: details,
    isError: isDetailsError,
    isPending: isDetailsPending,
  } = useRequestDetails(traceId);

  const relatedError = details?.logs.find((log) => log.callerLocation);
  const query = relatedError && getQueryFromLog(relatedError);

  const searchWords = useMemo(() => {
    if (!query) {
      return [];
    }

    return getSignificantWords(query);
  }, [query]);

  if (issuesLoading && isDetailsPending) {
    return <div>Loading...</div>;
  }

  if (isDetailsError && issuesError) {
    return <div>Error loading issues</div>;
  }

  if (!issues || issues.length === 0 || !query) {
    return (
      <div className="items-center gap-2 justify-center flex text-gray-500 mt-4">
        <ExclamationTriangleIcon />
        No related issues found
      </div>
    );
  }

  return (
    <ul role="list" className="divide-y divide-gray-700">
      {issues.map((issue) => (
        <li key={issue.id}>
          <a href={`/issues/${issue.id}`} className="block">
            <RelatedIssueCard {...issue} searchWords={searchWords} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function getQueryFromLog(log: MizuLog) {
  const message =
    typeof log.message === "string"
      ? log.message
      : log.message &&
        "message" in log.message &&
        typeof log.message.message === "string" &&
        log.message.message;

  return typeof message === "string" ? message : undefined;
}
