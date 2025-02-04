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
    method,
    path,
    updatePath: handlePathInputChange,
    updateMethod: handleMethodChange,
  } = useStudioStore("method", "path", "updatePath", "updateMethod");

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      // NOTE - For some reason, in prod (not locally), we get a `margin-block-end: 1rem` on the form element from the user-agent-stylesheet
      //        That's why we add `m-0` to the form element.
      className="flex items-center justify-between bg-input border rounded-lg m-0"
    >
      <div className="flex flex-grow items-center space-x-0">
        <RequestMethodCombobox
          method={method}
          handleMethodChange={handleMethodChange}
          allowUserToChange
        />
        <Input
          type="text"
          value={path}
          onChange={(e) => {
            handlePathInputChange(e.target.value);
          }}
          className="flex-grow text-xs w-full bg-transparent font-mono border-none shadow-none focus:ring-0 ml-0"
        />
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
