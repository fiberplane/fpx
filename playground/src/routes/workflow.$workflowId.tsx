import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { workflowQueryOptions } from "@/lib/hooks/useWorkflows";
import type { WorkflowStep, Parameter } from "@/types";
import { getRouteApi } from "@tanstack/react-router";

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
  const { openApiSpec } = getRouteApi("/workflow").useLoaderData();

  return (
    <div className="h-full p-4 overflow-auto border rounded-md">
      <div className="grid items-center justify-between mb-6">
        <div className="grid gap-1">
          <h2 className="text-2xl font-medium">{workflow.summary}</h2>
          {workflow.description && (
            <p className="text-sm text-foreground">{workflow.description}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <div>
          <h3 className="mb-4 text-lg font-medium">Steps</h3>
          <div className="grid gap-4">
            {workflow.steps.map((step: WorkflowStep, index: number) => (
              <Card
                key={step.stepId}
                className="relative shadow-none group bg-card/50"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                      {index + 1}. {step.description}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <p className="mb-1 text-sm font-medium">Operation</p>
                      <p className="text-sm text-foreground">
                        {step.operation}
                      </p>
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
                    {step.outputs.length > 0 && (
                      <>
                        <p className="mb-1 text-sm font-medium">Outputs</p>
                        <div className="grid gap-2">
                          {step.outputs.map((output) => (
                            <p
                              className="font-mono text-sm text-muted-foreground"
                              key={output.key}
                            >
                              {output.key}: {output.value}
                            </p>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
