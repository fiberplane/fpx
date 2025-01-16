import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowStatus } from "@/components/WorkflowStatus";
import { workflowQueryOptions } from "@/lib/hooks/useWorkflows";
import type { Step } from "@/types";

export const Route = createFileRoute("/workflow/$workflowId")({
  component: WorkflowDetail,
  loader: async ({ context: { queryClient }, params: { workflowId } }) => {
    const response = await queryClient.ensureQueryData(workflowQueryOptions(workflowId));
    return { workflow: response.data };
  }
});

function WorkflowDetail() {
  const { workflow } = Route.useLoaderData();

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">{workflow.name}</h2>
          <WorkflowStatus status={workflow.lastRunStatus} />
        </div>
        <div className="text-sm text-muted-foreground">
          Created at: {new Date(workflow.createdAt).toLocaleString()}
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-medium">Steps</h3>
        {workflow.steps.map((step: Step, index: number) => (
          <Card key={step.stepId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {index + 1}. {step.description}
                </CardTitle>
                <WorkflowStatus status="pending" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Operation: {step.operationPath || "No operation path"}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
