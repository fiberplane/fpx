import { useRelevantIssues } from "@/queries/queries";

export function RelatedIssueCounter({ traceId }: { traceId: string }) {
  const {
    data: issues,
    isLoading,
    isLoadingError,
  } = useRelevantIssues(traceId);

  if (isLoading || isLoadingError) {
    return null;
  }

  // console.log("issues", issues);
  return issues && issues.length || null
  // return <div>issues.length: {issues?.length}</div>;
}
