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
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AddToRouteForm } from "./AddToRouteForm";

export function AddRouteToCollection() {
  const [open, setOpen] = useState(false);

  useHotkeys("shift+c", () => {
    setOpen(true);
  });

  const handleSuccess = useHandler(() => {
    setOpen(false);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-xs" variant="ghost">
                <Icon icon="lucide:folder" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="left"
              className="bg-slate-900 px-2 py-1.5 text-white"
            >
              <p>Add to Collection</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-dvw">
        <AddToRouteForm onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
