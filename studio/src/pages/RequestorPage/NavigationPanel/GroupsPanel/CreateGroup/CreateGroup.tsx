import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Group } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { CreateGroupForm } from "./CreateGroupForm";

type Props = {
  selectGroup: (group: Group) => void;
};

export function CreateGroup(props: Props) {
  const { selectGroup } = props;
  useHotkeys("c", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  const [open, setOpen] = useState(false);
  const handleSuccess = useHandler((group: Group) => {
    setOpen(false);
    selectGroup(group);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="secondary" className="p-2.5">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          className="bg-slate-900 px-2 py-1.5 text-white flex gap-1.5"
          align="end"
        >
          Create a new group
          <div className="flex gap-0.5">
            <KeyboardShortcutKey>C</KeyboardShortcutKey>
          </div>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-96 max-lg:hidden">
        <CreateGroupForm onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
