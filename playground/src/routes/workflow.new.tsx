import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/workflow/new")({
  component: NewWorkflow,
});

function NewWorkflow() {
  const [userStory, setUserStory] = useState("");
  const navigate = useNavigate();
  const { mutate: createWorkflow, isPending, error } = useCreateWorkflow();

  const handleSubmit = () => {
    createWorkflow(userStory, {
      onSuccess: () => {
        navigate({ to: "/workflow" });
      },
    });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Create New Workflow</h2>
      </div>
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
        {error && (
          <div className="text-red-500">
            {error instanceof Error ? error.message : "Failed to create workflow"}
          </div>
        )}
      </div>
    </div>
  );
}
