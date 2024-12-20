import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkflowStatus } from "@/components/workflow-status";
import type { Workflow, WorkflowStep } from "@/lib/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/workflow/$workflowId")({
  validateSearch: (search: Record<string, unknown>) => ({}),
  component: WorkflowDetail,
  loader: async ({ params }): Promise<{ workflow: Workflow }> => {
    try {
      const token = localStorage.getItem("api-token");
      if (!token) {
        throw new Error("API token is required");
      }

      const projectResponse = await fetch("http://localhost:6246/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!projectResponse.ok) {
        throw new Error(`Failed to fetch project: ${projectResponse.statusText}`);
      }

      const projects = await projectResponse.json();
      const project = projects[0];

      console.log('Project ID:', project.id);
      console.log('Workflow ID:', params.workflowId);

      const response = await fetch(
        `http://localhost:6246/api/projects/${project.id}/prompts/${params.workflowId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const prompt = await response.json();
      console.log('Prompt data:', prompt);

      const workflow = {
        id: prompt.uuid,
        name: prompt.userStory,
        status: prompt.status,
        created_at: prompt.createdAt || new Date().toISOString(),
        updated_at: prompt.updatedAt || new Date().toISOString(),
        steps: prompt.workflow?.steps || [],
      };

      console.log('Transformed workflow:', workflow);
      return { workflow };
    } catch (error) {
      console.error('Workflow detail error:', error);
      throw error;
    }
  },
});

function WorkflowDetail() {
  const { workflow } = Route.useLoaderData();
  const navigate = useNavigate();

  return (
    <Sheet
      defaultOpen
      onOpenChange={(open) => {
        if (!open) {
          navigate({ to: "/workflow" });
        }
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{workflow.name}</SheetTitle>
            <WorkflowStatus status={workflow.status} />
          </div>
          <div className="text-sm text-muted-foreground">
            Created {new Date(workflow.created_at).toLocaleString()}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Workflow Steps</h2>
          {workflow?.steps?.map((step: WorkflowStep) => (
            <Card key={step.stepId}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-base font-medium">
                  {step.stepId}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                  {step.operationPath}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 text-sm">
                  {step.parameters && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Parameters</h4>
                      {step.parameters.map((param, paramIndex) => (
                        <div 
                          key={`${param.name}-${param.in}-${paramIndex}`} 
                          className="grid grid-cols-3 gap-2 text-muted-foreground"
                        >
                          <span>{param.name}</span>
                          <span className="text-muted-foreground/60">{param.in}</span>
                          <span className="font-mono text-xs">{param.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {step.successCriteria && (
                    <div className="space-y-1">
                      <h4 className="font-medium">Success Criteria</h4>
                      {step.successCriteria.map((criteria, criteriaIndex) => (
                        <div 
                          key={`${criteria.condition}-${criteriaIndex}`}
                          className="font-mono text-xs text-muted-foreground"
                        >
                          {criteria.condition}
                        </div>
                      ))}
                    </div>
                  )}
                  {step.outputs && (
                    <div className="space-y-1">
                      <h4 className="font-medium">Outputs</h4>
                      {Object.entries(step.outputs).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-2 gap-2 text-muted-foreground">
                          <span>{key}</span>
                          <span className="font-mono text-xs">{value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
