import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, isMac } from "@/utils";
import { Icon } from "@iconify/react";
import { RequestMethodCombobox } from "./RequestMethodCombobox";
import { useStudioStore } from "./store";
import { useUrlPreview } from "./store/hooks/useUrlPreview";
import { Method } from "../Method";

type PlaygroundInputProps = {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPlaygroundRequesting?: boolean;
  formRef: React.RefObject<HTMLFormElement>;
};

export function PlaygroundInput({
  onSubmit,
  isPlaygroundRequesting,
  formRef,
}: PlaygroundInputProps) {
  const {
    activeRoute,
  } = useStudioStore(
    "activeRoute",
  );

  const path = useUrlPreview() ?? "";
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      // NOTE - For some reason, in prod (not locally), we get a `margin-block-end: 1rem` on the form element from the user-agent-stylesheet
      //        That's why we add `m-0` to the form element.
      className="flex items-center justify-between bg-input border rounded-lg m-0"
    >
      <div className="flex flex-grow items-center gap-2">
        <Method
          method={activeRoute?.method || "GET"}
          className="ml-2 text-sm"
        />
        <div className="flex w-full my-2"><Input
          type="text"
          value={path}
          disabled
          className="flex-initial text-xs w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0 disabled:cursor-text disabled:bg-muted py-0"
        />
        </div>
      </div>
      <div className="flex items-center space-x-2 px-2 py-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              type="submit"
              disabled={isPlaygroundRequesting}
              variant="default"
              className={cn("p-2 md:px-2.5 py-1 h-auto")}
            >
              <span className="hidden md:inline">Send</span>
              <Icon
                icon="lucide:send-horizontal"
                className="w-4 h-4 md:hidden"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            className="bg-secondary px-2 py-1.5 flex gap-1.5"
            align="center"
            side="left"
            sideOffset={16}
          >
            <div className="flex gap-0.5">
              <KeyboardShortcutKey>{isMac ? "⌘" : "Ctrl"}</KeyboardShortcutKey>{" "}
              <KeyboardShortcutKey>Enter</KeyboardShortcutKey>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}
