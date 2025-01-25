import { Button } from "@/components/ui/button";
import { Search } from "@/garbage/RequestorPage/NavigationPanel/Search";
import { useDeleteWorkflow, useWorkflows } from "@/lib/hooks/useWorkflows";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export function WorkflowSidebar() {
  const { data: workflows, isLoading } = useWorkflows();
  const deleteWorkflow = useDeleteWorkflow();
  const [filterValue, setFilterValue] = useState("");

  if (!workflows) {
    return null;
  }
  workflows.reverse();

  // Filter workflows based on search
  const filteredWorkflows = workflows.filter((workflow) => {
    const cleanFilter = filterValue.trim().toLowerCase();
    if (cleanFilter.length < 3) {
      return true;
    }
    return (
      workflow.summary.toLowerCase().includes(cleanFilter) ||
      workflow.description?.toLowerCase().includes(cleanFilter)
    );
  });

  return (
    <div className="min-h-full overflow-auto">
      <div>
        <div className="relative mb-6 grid grid-cols-[1fr_auto] gap-2 items-center">
          <Search
            value={filterValue}
            onChange={setFilterValue}
            placeholder="workflows"
            itemCount={filteredWorkflows.length}
          />
          <Button variant="ghost" size="icon" asChild>
            <Link to="/workflow/new">
              <PlusIcon className="w-3 h-3" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-2">
          {isLoading ? (
            <div className="my-4 text-xs italic text-center text-muted-foreground">
              Loading workflows...
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="my-4 text-xs italic text-center text-muted-foreground">
              No workflows match filter criteria
            </div>
          ) : (
            filteredWorkflows.map((workflow) => (
              <div key={workflow.workflowId} className="relative group">
                <Link
                  to="/workflow/$workflowId"
                  params={{ workflowId: workflow.workflowId }}
                  className="flex items-start justify-between p-2 text-sm rounded cursor-pointer hover:bg-muted"
                >
                  <div className="grid gap-1">
                    <div className="font-medium truncate">
                      {workflow.summary}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.steps.length} steps
                    </div>
                  </div>
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute hidden group-hover:flex top-1 right-1"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteWorkflow.mutate(workflow.workflowId);
                  }}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
