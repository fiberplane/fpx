import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "@radix-ui/react-icons";
import type { Workflow } from "@/types";
import { useState } from "react";

interface WorkflowSidebarProps {
  workflows: Workflow[];
}

export function WorkflowSidebar({ workflows }: WorkflowSidebarProps) {
  console.log(workflows);
  const [filterValue, setFilterValue] = useState("");

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
      <div className="">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Link to="/workflow">
              <span className="text-foreground">Workflows</span>
            </Link>
          </div>
        </div>

        <div className="relative mb-6 grid grid-cols-[1fr_auto] gap-2">
          <Input
            type="search"
            placeholder="Search workflows..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-full pr-12 bg-background"
          />
          <Link to="/workflow/new">
            <Button variant="default" size="icon">
              <PlusIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-2">
          {filteredWorkflows.length === 0 ? (
            <div className="my-4 text-xs italic text-center text-muted-foreground">
              No workflows match filter criteria
            </div>
          ) : (
            filteredWorkflows.map((workflow) => (
              <Link
                key={workflow.id}
                to="/workflow/$workflowId"
                params={{ workflowId: workflow.id }}
                className="flex items-start justify-between p-2 text-sm rounded cursor-pointer hover:bg-muted"
              >
                <div className="grid gap-1">
                  <div className="font-medium truncate">{workflow.summary}</div>
                  <div className="text-xs text-muted-foreground">
                    {workflow.steps.length} steps
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
