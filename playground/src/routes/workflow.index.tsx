import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { workflowsQueryOptions } from "@/lib/hooks/useWorkflows";
import type { ApiError, ApiResponse, Workflow } from "@/types";

export const Route = createFileRoute("/workflow/")({
  component: WorkflowOverview,
  loader: async ({ context: { queryClient } }) => {
    const response = await queryClient.ensureQueryData(workflowsQueryOptions()) as ApiResponse<Workflow[]> | ApiError;
    if (!response.success) {
      throw new Error(response.error.message);
    }
    return { workflows: response.data };
  }
});

function WorkflowOverview() {
  const { workflows } = Route.useLoaderData();

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="mb-2 text-lg font-medium">No workflows found</h2>
        <p className="text-sm text-muted-foreground">Create a new workflow to get started</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-semibold">Workflows</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Link
            key={workflow.workflowId}
            to="/workflow/$workflowId"
            params={{ workflowId: workflow.workflowId }}
            className="block transition-colors border rounded-lg hover:bg-muted"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="grid gap-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{workflow.summary}</div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {workflow.steps.length} steps
                  </p>
                </div>
              </div>
              {workflow.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {workflow.description}
                </p>
              )}
              
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
