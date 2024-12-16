import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils";
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
        <Button
          size="sm"
          variant="outline"
          type="button"
          className={cn("p-2 md:px-2.5 py-1 h-auto")}
        >
          <Icon icon="lucide:folder" className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 max-w-dvw">
        <AddToRouteForm onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
