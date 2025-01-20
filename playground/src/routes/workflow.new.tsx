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
      oaiSchemaId: firstSchema.id,
    });
  };

  return (
    <div className="grid min-h-screen p-8 place-items-center">
      <div className="w-[800px]">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold">What do you want to build?</h2>
          <p>Describe your integration, and we'll generate a workflow for you using our API</p>
        </div>

        <WorkflowPrompt
          userStory={userStory}
          setUserStory={setUserStory}
          handleSubmit={handleSubmit}
          isPending={isPending}
        />

        {error && (
          <div className="mt-4 text-red-500">
            {error instanceof Error ? error.message : "Failed to create workflow"}
          </div>
        )}
      </div>
    </div>
  );
}
