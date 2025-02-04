import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isMac } from "@/utils";
import { SparklesIcon } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStudioStore } from "../store";

export function Faker() {
  const { fillInFakeData } = useStudioStore("fillInFakeData");

  useHotkeys("mod+g", fillInFakeData);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          className="p-2 h-auto hover:bg-transparent transition-colors"
          size="sm"
          onClick={fillInFakeData}
        >
          <SparklesIcon className="w-4 h-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">
        Use sample data
        <div className="inline-flex ml-1 gap-0.5">
          <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
          <KeyboardShortcutKey>G</KeyboardShortcutKey>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
