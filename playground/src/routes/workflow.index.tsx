import { workflowsQueryOptions } from "@/lib/hooks/useWorkflows";
import { createFileRoute } from "@tanstack/react-router";
import { NewWorkflow } from "./workflow.new";

export const Route = createFileRoute("/workflow/")({
  component: WorkflowOverview,
  loader: async ({ context: { queryClient } }) => {
    const response = await queryClient.ensureQueryData(workflowsQueryOptions());
    return { workflows: response.data };
  },
});

function WorkflowOverview() {
  const { workflows } = Route.useLoaderData();

  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="mb-2 text-lg font-medium">No workflows found</h2>
        <p className="text-sm text-muted-foreground">
          Create a new workflow to get started
        </p>
      </div>
    );
  }
  return <NewWorkflow />;
}
