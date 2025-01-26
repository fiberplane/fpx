import {
  Dialog,
  // DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateWorkflow } from "@/lib/hooks/useWorkflows";
import { useWorkflowStore } from "@/lib/workflowStore";
import { useRouteContext } from "@tanstack/react-router";
import React, { useEffect } from "react";

export function WorkflowCommand() {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { mutate: createWorkflow, isPending } = useCreateWorkflow();
  const { openapi } = useRouteContext({ from: "__root__" });

  const { isWorkflowCommandOpen, setWorkflowCommandOpen } = useWorkflowStore();

  const handleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue && openapi?.content) {
        createWorkflow(
          {
            prompt: trimmedValue,
            openApiSchema: openapi.content,
          },
          {
            onSuccess: () => {
              setInputValue("");
              setWorkflowCommandOpen(false);
            },
          },
        );
      }
    }
  };

  // Reset input value when dialog closes
  useEffect(() => {
    if (!isWorkflowCommandOpen) {
      setInputValue("");
    }
  }, [isWorkflowCommandOpen]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isWorkflowCommandOpen) {
      inputRef.current?.focus();
    }
  }, [isWorkflowCommandOpen]);

  return (
    <Dialog
      open={isWorkflowCommandOpen}
      onOpenChange={(open) => !isPending && setWorkflowCommandOpen(open)}
      modal={false}
    >
      <DialogContent className="overflow-hidden p-0 shadow-lg max-w-[500px] mx-auto bg-popover">
        <DialogTitle className="sr-only">Workflow Command</DialogTitle>
        <DialogDescription className="sr-only">
          Enter a workflow command...
        </DialogDescription>
        <div className="flex items-center border-0 rounded-lg">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="E.g. Get the user's profile and then update their email"
              className="flex w-full px-3 py-2 text-sm bg-transparent rounded-md outline-none h-11"
              onKeyDown={handleSubmit}
              disabled={isPending}
            />
            {isPending && (
              <div className="absolute -translate-y-1/2 right-4 top-1/2">
                <div className="w-4 h-4 border-2 rounded-full border-foreground border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
