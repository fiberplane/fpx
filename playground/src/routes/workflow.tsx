import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { WorkflowStatus } from "@/components/WorkflowStatus";
import { useWorkflows } from "@/lib/hooks/useWorkflows";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";

export const Route = createFileRoute("/workflow")({
  component: WorkflowLayout,
});

function WorkflowLayout() {
  const { data: workflows, isLoading, error } = useWorkflows();
  const [userStory, setUserStory] = useState("");
  const { mutate: createWorkflow, isPending } = useCreateWorkflow();

  const handleSubmit = () => {
    if (!userStory.trim()) {
      return;
    }
    createWorkflow(userStory, {
      onSuccess: () => {
        setUserStory("");
      },
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <div className="grid grid-cols-[300px_1fr] h-full">
        {/* Sidebar */}
        <div className="overflow-auto border-r">
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 font-semibold rounded bg-primary text-primary-foreground">
                  fpx
                </div>
                <span className="font-semibold text-foreground">Workflows</span>
              </div>
              <ModeToggle />
            </div>

            <div className="relative mb-6">
              <Input
                type="search"
                placeholder="Search"
                className="w-full pr-12 bg-white"
              />
              <kbd className="pointer-events-none absolute right-3 top-2.5 h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>

            <div className="grid gap-2">
              {workflows?.map((workflow) => (
                <Link
                  key={workflow.id}
                  to="/workflow/$workflowId"
                  params={{ workflowId: workflow.id }}
                  className="flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted"
                >
                  <div className="grid gap-1">
                    <div className="font-medium truncate">{workflow.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {workflow.steps.length} steps
                    </div>
                  </div>
                  <WorkflowStatus status={workflow.status} />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-rows-[auto_1fr] overflow-hidden">
          {/* Prompt Area */}
          <div className="p-4 border-b">
            <div className="grid gap-4">
              <Textarea
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Enter a user story or description..."
                className="w-full"
                rows={4}
              />
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Creating..." : "Create Workflow"}
              </Button>
            </div>
          </div>

          {/* Details Area */}
          <div className="overflow-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
