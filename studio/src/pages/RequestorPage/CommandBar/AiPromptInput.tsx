import { Dialog, DialogContent } from "@/components/ui/dialog";
import React from "react";

interface AiPromptInputProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onGenerateRequest?: (prompt?: string) => void;
  setAiPrompt: (prompt?: string) => void;
}

export function AiPromptInput({
  open,
  setOpen,
  onGenerateRequest,
  setAiPrompt,
}: AiPromptInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      onGenerateRequest?.(trimmedValue);
      setAiPrompt(undefined);
      setOpen(false);
      setInputValue("");
    }
  };

  // Reset input value when dialog closes
  React.useEffect(() => {
    if (!open) {
      setInputValue("");
    }
  }, [open]);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogContent className="p-0 border shadow-lg max-w-[500px] mx-auto bg-background">
        <div className="flex items-center border-0 rounded-lg">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setAiPrompt(e.target.value);
            }}
            placeholder="Enter prompt for AI request generation..."
            className="flex h-11 w-full rounded-md bg-transparent px-3 py-2 text-sm outline-none"
            onKeyDown={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
