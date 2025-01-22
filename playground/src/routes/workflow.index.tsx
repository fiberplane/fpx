import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { workflowsQueryOptions } from "@/lib/hooks/useWorkflows";
import type { Workflow } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";

export const Route = createFileRoute("/workflow/")({
  component: WorkflowOverview,
  loader: async ({ context: { queryClient } }) => {
    const response = await queryClient.ensureQueryData(workflowsQueryOptions());
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
    <div className="grid h-full overflow-auto">
      <div className="grid p-6 place-items-center">
        <div className="grid gap-4 text-center">
          <p>Select a workflow or create a new one to get started</p>
          <Button asChild>
            <Link to="/workflow/new">
              <PlusIcon className="w-4 h-4 mr-2" />
              New Workflow
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
