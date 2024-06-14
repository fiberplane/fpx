import { Card } from "@/components/ui/card";
import { DependenciesList } from "./DependenciesList";
import { IssueSection } from "./IssueSection";
import { RelatedIssueList } from "./RelatedIssueList";

export function RelatedIssuesContent(props: { traceId: string }) {
  const { traceId } = props;

  return (
    <div className="flex flex-row gap-2">
      <Card x-chunk="dashboard-06-chunk-0" className="basis-2/3">
        <IssueSection
          title="Related issues"
          description="See issues related to this request"
        >
          <RelatedIssueList traceId={traceId} />
        </IssueSection>
      </Card>
      <Card x-chunk="dashboard-06-chunk-0" className="basis-1/3">
        <IssueSection
          title="Dependencies"
          description="Navigate to the repositories related to this request"
        >
          <DependenciesList />
        </IssueSection>
      </Card>
    </div>
  );
}
