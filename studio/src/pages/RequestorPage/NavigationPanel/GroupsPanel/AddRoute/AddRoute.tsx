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
  groupId: string;
};

export function AddRoute(props: Props) {
  const { groupId } = props;

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
