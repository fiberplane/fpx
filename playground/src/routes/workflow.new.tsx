import { WorkflowPrompt } from "@/components/WorkflowPrompt";
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/workflow/new")({
  component: NewWorkflow,
});

export function NewWorkflow() {
  const [userStory, setUserStory] = useState("");
  const { mutate: createWorkflow, isPending, error } = useCreateWorkflow();
  const { openapi } = useRouteContext({ from: "__root__" });

  if (!openapi) {
    console.error("No OpenAPI spec found");
  }

  const handleSubmit = () => {
    createWorkflow({
      prompt: userStory,
      openApiSchema: openapi?.content ?? "",
    });
  };

  return (
    <div className="flex flex-col justify-center h-full p-4 overflow-auto border rounded-md">
      <div className="grid gap-4 text-center max-w-[800px] mx-auto">
        <h3 className="text-lg font-medium">Create Your API Workflow</h3>
        <p className="text-sm text-foreground">
          Describe your HTTP request chain in natural language and we'll
          generate it.
        </p>

        <WorkflowPrompt
          userStory={userStory}
          setUserStory={setUserStory}
          handleSubmit={handleSubmit}
          isPending={isPending}
        />

        {error && (
          <div className="p-4 mt-4 border rounded-lg border-destructive/50 bg-destructive/10 text-destructive">
            {error instanceof Error
              ? error.message
              : "Failed to create workflow"}
          </div>
        )}
      </div>
    </div>
  );
}
