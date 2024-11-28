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
import { COLLECTION_ROUTE } from "@/constants";
import type { Collection } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { generatePath, useNavigate, useSearchParams } from "react-router-dom";
import { CreateCollectionForm } from "./CreateCollectionForm";

type Props = {
  selectCollection: (group: Collection) => void;
};

export function CreateCollection(props: Props) {
  const { selectCollection } = props;
  useHotkeys("c", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleSuccess = useHandler((collection: Collection) => {
    setOpen(false);
    selectCollection(collection);
    navigate({
      pathname: generatePath(COLLECTION_ROUTE, {
        collectionId: collection.id.toString(),
      }),
      search: searchParams.toString(),
    });
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
      <PopoverContent className="w-80 max-w-dvw" align="end">
        <CreateCollectionForm onSuccess={handleSuccess} />
      </PopoverContent>
    </Popover>
  );
}
