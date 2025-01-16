import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWorkflowMutationOptions, WORKFLOWS_KEY } from "@/lib/hooks/useWorkflows";
import { useState } from "react";
import { WorkflowPrompt } from "@/components/WorkflowPrompt";

export const Route = createFileRoute("/workflow/new")({
  component: NewWorkflow,
});

function NewWorkflow() {
  const [userStory, setUserStory] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate: createWorkflow, isPending, error } = useMutation({
    ...createWorkflowMutationOptions(queryClient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [WORKFLOWS_KEY] });
      navigate({ to: "/workflow" });
    },
  });

  const handleSubmit = () => {
    createWorkflow({
      name: "New Workflow",
      prompt: userStory,
      oaiSchemaId: "123",
    });
  };

  return (
    <div className="grid min-h-screen p-8 place-items-center">
      <div className="w-[800px]">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-bold">Create New Workflow</h2>
          <p>Use the force</p>
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
