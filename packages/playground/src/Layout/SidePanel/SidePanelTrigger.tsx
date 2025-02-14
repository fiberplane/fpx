import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { useStudioStore } from "@/components/playground/store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isMac } from "@/utils";
import { Icon } from "@iconify/react";
import { useHotkeys } from "react-hotkeys-hook";

export function SidePanelTrigger() {
  const { sidePanel, togglePanel } = useStudioStore("sidePanel", "togglePanel");

  useHotkeys("mod+b", () => {
    togglePanel("sidePanel");
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="p-0.5 w-6 h-6 hover:bg-secondary hover:text-secondary-foreground"
          onClick={() => togglePanel("sidePanel")}
        >
          <Icon
            icon={`lucide:panel-left-${sidePanel === "open" ? "close" : "open"}`}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent className=" px-2 py-1.5 flex gap-1.5" align="start">
        Open Side Panel
        <div className="flex gap-0.5">
          <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
          <KeyboardShortcutKey>B</KeyboardShortcutKey>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
