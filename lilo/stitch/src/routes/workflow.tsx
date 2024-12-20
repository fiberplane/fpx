import * as React from "react";
import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play } from "lucide-react";
import { WorkflowStatus } from "@/components/workflow-status";
import type { Workflow, PromptResponse } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export const Route = createFileRoute("/workflow")({
  loader: async ({ context }): Promise<{ workflows: Workflow[] }> => {
    try {
      const token = localStorage.getItem("api-token");
      if (!token) {
        return { workflows: [] };
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

      const response = await fetch(`http://localhost:6246/api/projects/${project.id}/prompts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { workflows: [] };
        }
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }

      const prompts = (await response.json()) as PromptResponse[];
      const workflows = prompts.map((prompt) => ({
        id: prompt.uuid,
        name: prompt.userStory || prompt.prompt,
        status: prompt.status,
        created_at: prompt.createdAt || new Date().toISOString(),
        updated_at: prompt.updatedAt || new Date().toISOString(),
        steps: prompt.workflow?.steps || [],
      }));

      return { workflows };
    } catch (error) {
      console.error("Error fetching workflows:", error);
      return { workflows: [] };
    }
  },
  component: WorkflowPage,
});

function NoWorkflows({ error }: { error?: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="w-4 h-4" />
      <AlertTitle>No workflows found</AlertTitle>
      <AlertDescription>
        {error || "Please check your API token or try again later."}
      </AlertDescription>
    </Alert>
  );
}

function WorkflowCard({ workflow }: { workflow: Workflow }) {
  const navigate = useNavigate();
  const isClickable = workflow.steps && workflow.steps.length > 0;
  const isFailed = workflow.status === "failed";

  console.log(workflow);

  return (
    <Card
      className={cn(
        "transition-colors",
        isClickable && "cursor-pointer hover:bg-accent/50",
        !isClickable && "opacity-75",
        isFailed && "opacity-50 grayscale"
      )}
      onClick={() => {
        if (isClickable) {
          navigate({
            to: "/workflow/$workflowId",
            params: { workflowId: workflow.id },
          });
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className={cn(
          "text-base font-medium",
          isFailed && "text-muted-foreground"
        )}>
          {workflow.name}
        </CardTitle>
        <WorkflowStatus status={workflow.status} />
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Created</span>
            <span>
              {new Date(workflow.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Last Updated</span>
            <span>
              {new Date(workflow.updated_at).toLocaleDateString()}
            </span>
          </div>
          {isClickable && (
            <div className="text-sm text-muted-foreground">
              {workflow.steps.length} step{workflow.steps.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowPage() {
  const { workflows } = Route.useLoaderData();
  const navigate = useNavigate();
  const [userStory, setUserStory] = React.useState("");

  const createWorkflow = useMutation({
    mutationFn: async (userStory: string) => {
      const token = localStorage.getItem("api-token");
      if (!token) {
        throw new Error("API token is required");
      }

      // First get the project
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

      // Then create the prompt
      const response = await fetch(`http://localhost:6246/api/projects/${project.id}/prompts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userStory: userStory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      navigate({
        to: "/workflow/$workflowId",
        params: { workflowId: data.uuid },
      });
    },
  });

  return (
    <>
      <div className="space-y-8">
        {/* New Workflow Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">Create New Workflow</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate a workflow from a user story
            </p>
          </div>
          <div className="space-y-4">
            <Textarea
              value={userStory}
              onChange={(e) => setUserStory(e.target.value)}
              placeholder="Enter a user story or description..."
              className="w-full"
              rows={4}
            />
            <div className="space-y-2">
              <Button 
                onClick={() => createWorkflow.mutate(userStory)}
                disabled={createWorkflow.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                {createWorkflow.isPending ? "Generating..." : "Generate Workflow"}
              </Button>
              {createWorkflow.error && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {createWorkflow.error instanceof Error 
                      ? createWorkflow.error.message 
                      : "Failed to create workflow"}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>

        {/* Existing Workflows Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold">Recent Workflows</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View your completed workflows
            </p>
          </div>
          {workflows.length === 0 ? (
            <NoWorkflows />
          ) : (
            <>
              {/* Completed Workflows */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Completed Workflows</h3>
                <div className="grid gap-4">
                  {workflows
                    .filter((w) => w.status === "completed")
                    .map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                </div>
              </div>

              {/* In Progress Workflows */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-muted-foreground">In Progress</h3>
                <div className="grid gap-4">
                  {workflows
                    .filter((w) => w.status === "pending")
                    .map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                </div>
              </div>

              {/* Failed Workflows */}
              <div className="space-y-4 opacity-90">
                <h3 className="text-lg font-medium text-muted-foreground">Failed Workflows</h3>
                <div className="grid gap-4">
                  {workflows
                    .filter((w) => w.status === "failed")
                    .map((workflow) => (
                      <WorkflowCard key={workflow.id} workflow={workflow} />
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Outlet />
    </>
  );
}
