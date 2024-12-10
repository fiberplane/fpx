import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { AddToRouteForm } from "./AddToRouteForm";

export function AddRouteToCollection() {
  const [open, setOpen] = useState(false);
  const handleSuccess = useHandler(() => {
    setOpen(false);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div>
          <Button size="icon-xs" variant="ghost">
            <Icon icon="lucide:folder" />
          </Button>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-dvw">
        <AddToRouteForm onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
