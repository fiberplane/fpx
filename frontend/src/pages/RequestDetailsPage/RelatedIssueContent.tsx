import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRelevantIssues } from "@/queries/queries";
import { RelatedIssueCard } from "./RelatedIssueCard";

export function RelatedIssueContent(props: { traceId: string }) {
  const { traceId } = props;
  const { data, isLoading } = useRelevantIssues(traceId);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!data) {
    return <div>No data</div>
  }

  return (
    <Card x-chunk="dashboard-06-chunk-0">
      <CardHeader>
        <CardTitle>Related Issues</CardTitle>
        <CardDescription>
          See issues related to this request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul role="list" className="divide-y divide-gray-200">
          {data.map((issue) => (
            <li key={issue.id}>
              <a href={`/issues/${issue.id}`} className="block">
                <RelatedIssueCard {...issue} />
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
