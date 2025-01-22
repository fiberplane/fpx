import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workflowQueryOptions } from "@/lib/hooks/useWorkflows";
import type { WorkflowStep, Parameter } from "@/types";

export const Route = createFileRoute("/workflow/$workflowId")({
  component: WorkflowDetail,
  loader: async ({ context: { queryClient }, params: { workflowId } }) => {
    const response = await queryClient.ensureQueryData(
      workflowQueryOptions(workflowId),
    );
    return { workflow: response.data };
  },
});

function WorkflowDetail() {
  const { workflow } = Route.useLoaderData();

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="grid gap-1">
            <h2 className="text-2xl font-semibold">{workflow.summary}</h2>
            {workflow.description && (
              <p className="text-sm text-muted-foreground">
                {workflow.description}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <h3 className="mb-4 text-lg font-medium">Steps</h3>
            <div className="grid gap-4">
              {workflow.steps.map((step: WorkflowStep, index: number) => (
                <Card key={step.stepId} className="relative group">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {index + 1}. {step.description}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div>
                        <div className="mb-1 text-sm font-medium">
                          Operation
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {step.operation}
                        </div>
                      </div>
                      {step.parameters.length > 0 && (
                        <div>
                          <div className="mb-2 text-sm font-medium">
                            Parameters
                          </div>
                          <div className="grid gap-2">
                            {step.parameters.map((param: Parameter) => (
                              <div
                                key={param.name}
                                className="flex items-start gap-2 text-sm"
                              >
                                <div className="font-mono text-muted-foreground">
                                  {param.name}:
                                </div>
                                <div className="text-muted-foreground">
                                  {param.value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
