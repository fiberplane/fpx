import { Link } from "@tanstack/react-router";
import { WorkflowStatus } from "@/components/WorkflowStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { PlusIcon } from "@radix-ui/react-icons";
import type { Workflow } from "@/types";

interface WorkflowSidebarProps {
  workflows: Workflow[];
}

export function WorkflowSidebar({ workflows }: WorkflowSidebarProps) {
  return (
    <div className="min-h-full overflow-auto border-r">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 font-mono text-xs font-semibold rounded bg-primary text-primary-foreground">
              fpx
            </div>
            <span className="font-semibold text-foreground">Workflows</span>
          </div>
          <ModeToggle />
        </div>

        <div className="relative mb-6 grid grid-cols-[1fr_auto] gap-2">
          <Input
            type="search"
            placeholder="Search"
            className="w-full pr-12 bg-white"
          />
          <Link to="/workflow/new">
            <Button variant="default" size="icon">
              <PlusIcon className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Workflows</h2>
            <div className="grid gap-2">
              {workflows?.slice(0, 5).map((workflow) => (
                <Link
                  key={workflow.id}
                  to="/workflow/$workflowId"
                  params={{ workflowId: workflow.id }}
                  className="flex items-start justify-between p-2 text-sm rounded cursor-pointer hover:bg-muted"
                >
                  <div className="grid gap-1">
                    <div className="font-medium truncate">{workflow.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.steps.length} steps
                    </div>
                  </div>
                  <WorkflowStatus status={workflow.lastRunStatus} />
                </Link>
              ))}
              {workflows.length > 5 && (
                <Link
                  to="/workflow"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  View all workflows ({workflows.length})
                </Link>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Routes</h2>
            <div className="grid gap-2">
              {/* Routes will be added here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 