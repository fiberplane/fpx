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
// import { CreateGroupForm } from "./CreateGroupForm";
import { useHandler } from "@fiberplane/hooks";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AddRouteForm } from "./AddRouteForm";
// import type { Group } from "@fiberplane/fpx-types";

type Props = {
  groupId: string;
};

export function AddRoute(props: Props) {
  const { groupId } = props;
  // useHotkeys("c", (e) => {
  //   e.preventDefault();
  //   setOpen(true);
  // });

  const [open, setOpen] = useState(false);
  const handleSuccess = useHandler(
    (
      // group: Group
    ) => {
      setOpen(false);
      // selectGroup(group);
    },
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="ms-3 w-auto">
          + Add route
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 max-lg:hidden">
        <AddRouteForm groupId={groupId} onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
