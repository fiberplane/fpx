import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface WorkflowPromptProps {
  userStory: string;
  setUserStory: (userStory: string) => void;
  handleSubmit: () => void;
  isPending: boolean;
}

export function WorkflowPrompt({
  userStory,
  setUserStory,
  handleSubmit,
  isPending,
}: WorkflowPromptProps) {
  return (
    <div className="relative">
      <Textarea
        value={userStory}
        onChange={(e) => setUserStory(e.target.value)}
        placeholder="Enter a user story or description..."
        className={cn("w-full bg-input text-foreground", "p-4")}
        rows={4}
      />
      <Button
        onClick={handleSubmit}
        disabled={isPending}
        size="sm"
        className="absolute bottom-4 right-4"
      >
        {isPending ? "Creating..." : "Create Workflow"}
      </Button>
    </div>
  );
}
