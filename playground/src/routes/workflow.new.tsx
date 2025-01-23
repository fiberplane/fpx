import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows";
import { useState } from "react";
import { WorkflowPrompt } from "@/components/WorkflowPrompt";
import { getRouteApi } from "@tanstack/react-router";

export const Route = createFileRoute("/workflow/new")({
  component: NewWorkflow,
});

function NewWorkflow() {
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
        <h3 className="text-lg font-medium">What do you want to build?</h3>
        <p className="text-sm text-foreground">
          Describe your integration, and we'll generate a workflow for you using
          our API
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
