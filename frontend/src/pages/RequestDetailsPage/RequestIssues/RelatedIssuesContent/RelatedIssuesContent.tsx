import { CardSection } from "@/components/ui/card";
import { DependenciesList } from "./DependenciesList";
import { RelatedIssueList } from "./RelatedIssueList";

export function RelatedIssuesContent(props: { traceId: string }) {
  const { traceId } = props;

  return (
    <div className="flex flex-row gap-2">
      <CardSection
        className="basis-2/3"
        title="Related issues"
        description="See issues related to this request"
      >
        <RelatedIssueList traceId={traceId} />
      </CardSection>
      <CardSection
        className="basis-1/3"
        title="Dependencies"
        description="Navigate to the repositories related to this request"
      >
        <DependenciesList />
      </CardSection>
    </div>
  );
}
