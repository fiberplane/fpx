import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import { useOtelTrace } from "@/queries";
import { useRelevantIssues } from "@/queries/queries";
import { OtelEvent } from "@/queries/traces-otel";
import { useMemo } from "react";
import { getString } from "../../v2/otel-helpers";
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
    data: spans,
    isError: isDetailsError,
    isPending: isDetailsPending,
  } = useOtelTrace(traceId);

  // TODO - Test that this works with Otel traces
  const relatedError = spans
    ?.flatMap((t) => t.events)
    .find((e) => e.name === "exception" && getString(e.attributes.message));
  const query = relatedError && getQueryFromEvent(relatedError);

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

function getQueryFromEvent(event: OtelEvent) {
  return getString(event.attributes.message);
}
