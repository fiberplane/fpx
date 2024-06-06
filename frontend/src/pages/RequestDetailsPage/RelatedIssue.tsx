import { useRelevantIssues } from "@/queries/queries";

export function RelatedIssue({ traceId }: { traceId: string }) {
  const {
    data: issues,
    isLoading,
    isLoadingError,
  } = useRelevantIssues(traceId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isLoadingError) {
    return <div>Error loading issues</div>;
  }

  return <div>{issues?.length}</div>;
}
