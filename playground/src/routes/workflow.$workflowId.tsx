import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowStatus } from "@/components/WorkflowStatus";
import { useWorkflow } from "@/lib/hooks/useWorkflows";

export const Route = createFileRoute("/workflow/$workflowId")({
  component: WorkflowDetail,
});

function WorkflowDetail() {
  const { workflowId } = Route.useParams();
  const { data: workflow, isLoading, error } = useWorkflow(workflowId);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4">Error: {error.message}</div>;
  }

  if (!workflow) {
    return <div className="p-4">Workflow not found</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">{workflow.name}</h2>
          <WorkflowStatus status={workflow.status} />
        </div>
        <div className="text-sm text-muted-foreground">
          Created at: {new Date(workflow.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-medium">Steps</h3>
        {workflow.steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {index + 1}. {step.name}
                </CardTitle>
                <WorkflowStatus status={step.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Operation: {step.operationPath}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
