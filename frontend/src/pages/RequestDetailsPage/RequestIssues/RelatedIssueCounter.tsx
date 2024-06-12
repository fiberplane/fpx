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

  return (issues && issues.length) || null;
}
