import { createFileRoute } from "@tanstack/react-router";
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows";
import { useState } from "react";
import { WorkflowPrompt } from "@/components/WorkflowPrompt";
import { useSchemas } from "@/lib/hooks/useSchemas";

export const Route = createFileRoute("/workflow/new")({
  component: NewWorkflow,
});

function NewWorkflow() {
  const [userStory, setUserStory] = useState("");
  const { mutate: createWorkflow, isPending, error } = useCreateWorkflow();
  const { data: schemas } = useSchemas();
  const firstSchema = schemas?.[0];

  const handleSubmit = () => {
    if (!firstSchema) {
      console.error("No schema found");
      return;
    }

    createWorkflow({
      prompt: userStory,
      openApiSchemaId: firstSchema.id,
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Create Workflow</h2>
        </div>
        
        <div className="max-w-[800px] mx-auto">
          <div className="mb-8">
            <h3 className="mb-2 text-lg font-medium">What do you want to build?</h3>
            <p className="text-sm text-muted-foreground">
              Describe your integration, and we'll generate a workflow for you using our API
            </p>
          </div>

          <WorkflowPrompt
            userStory={userStory}
            setUserStory={setUserStory}
            handleSubmit={handleSubmit}
            isPending={isPending}
          />

          {error && (
            <div className="p-4 mt-4 border rounded-lg border-destructive/50 bg-destructive/10 text-destructive">
              {error instanceof Error ? error.message : "Failed to create workflow"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
