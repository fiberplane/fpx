import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUpdateCollection } from "@/queries/collections";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useState } from "react";
import { CollectionForm } from "../CollectionForm";

export function EditCollection(props: { name: string; collectionId: string }) {
  const { name, collectionId } = props;
  const [open, setOpen] = useState(false);

  const { mutate, error, isPending } = useUpdateCollection();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-2 py-1 rounded-lg hover:bg-muted cursor-pointer text-left">
        <Icon icon="lucide:pencil" className="h-3 w-3" />
      </DialogTrigger>
      <DialogPortal>
        <DialogContent className="w-80 max-w-screen-sm">
          <CollectionForm
            onSubmit={(data) => {
              mutate({
                collectionId,
                params: data,
              });
              console.log("close");
              setOpen(false);
            }}
            isPending={isPending}
            error={error}
            initialData={{
              name,
            }}
          />
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
