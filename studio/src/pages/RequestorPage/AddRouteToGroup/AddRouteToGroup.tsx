import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { AddToRouteForm } from "./AddToRouteForm";

export function AddRouteToGroup() {
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
      <PopoverContent className="w-96 max-lg:hidden">
        <AddToRouteForm onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
