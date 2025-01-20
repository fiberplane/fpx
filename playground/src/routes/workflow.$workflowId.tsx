import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workflowQueryOptions } from "@/lib/hooks/useWorkflows";
import type { Workflow, WorkflowStep, Parameter, ApiError, ApiResponse } from "@/types";

export const Route = createFileRoute("/workflow/$workflowId")({
  component: WorkflowDetail,
  loader: async ({ context: { queryClient }, params: { workflowId } }) => {
    const response = (await queryClient.ensureQueryData(
      workflowQueryOptions(workflowId),
    )) as ApiResponse<Workflow> | ApiError;
    if (!response.success) {
      throw new Error(response.error.message);
    }
    return { workflow: response.data };
  },
});

function WorkflowDetail() {
  const { workflow } = Route.useLoaderData();

  return (
    <div className="p-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Create Workflow</h1>
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">{workflow.summary}</h2>
        </div>
        <div className="text-sm text-muted-foreground">
          {workflow.description}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">{workflow.summary}</h1>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-medium">Steps</h3>
        {workflow.steps.map((step: WorkflowStep, index: number) => (
          <Card key={step.stepId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {index + 1}. {step.description}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Operation: {step.operation}
              </div>
              {step.parameters.length > 0 && (
                <div className="mt-2">
                  <div className="text-sm font-medium">Parameters:</div>
                  <div className="grid gap-1 mt-1">
                    {step.parameters.map((param: Parameter) => (
                      <div key={param.name} className="text-sm text-muted-foreground">
                        {param.name}: {param.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
