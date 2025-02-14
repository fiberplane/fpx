import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useHandler } from "@fiberplane/hooks";
import { useState } from "react";
import { AddRouteForm } from "./AddRouteForm";

type Props = {
  collectionId: number;
};

export function AddRoute(props: Props) {
  const { collectionId } = props;

  const [open, setOpen] = useState(false);
  const handleSuccess = useHandler(() => {
    setOpen(false);
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="ms-3 w-auto">
          + Add route
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <AddRouteForm collectionId={collectionId} onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
