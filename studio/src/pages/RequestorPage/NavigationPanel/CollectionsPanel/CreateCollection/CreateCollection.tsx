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
import { useAddCollection } from "@/queries";
import type { Collection } from "@fiberplane/fpx-types";
import { useHandler } from "@fiberplane/hooks";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { generatePath, useNavigate, useSearchParams } from "react-router-dom";
import {
  CollectionForm,
  type CollectionFormData,
} from "../../../CollectionForm";

export function CreateCollection() {
  useHotkeys("c", (e) => {
    e.preventDefault();
    setOpen(true);
  });

  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleSuccess = useHandler((collection: Collection) => {
    setOpen(false);
    navigate({
      pathname: generatePath(COLLECTION_ROUTE, {
        collectionId: collection.id.toString(),
      }),
      search: searchParams.toString(),
    });
  });

  const {
    mutate: addCollection,
    failureReason: error,
    isPending,
  } = useAddCollection();
  const onSubmit: SubmitHandler<CollectionFormData> = ({ name }) => {
    addCollection(
      {
        name,
      },
      {
        onSuccess: (data) => {
          handleSuccess(data);
        },
      },
    );
  };

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
        <CollectionForm
          onSubmit={onSubmit}
          isPending={isPending}
          error={error}
        />
      </PopoverContent>
    </Popover>
  );
}
