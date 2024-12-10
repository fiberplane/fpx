import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useUpdateCollection } from "@/queries/collections";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { CollectionForm } from "../CollectionForm";

export function EditCollection(props: { name: string; collectionId: string }) {
  const { name, collectionId } = props;
  const [open, setOpen] = useState(false);

  const { mutate, error, isPending } = useUpdateCollection();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({
          size: "icon-xs",
          variant: "secondary",
        })}
      >
        <Icon icon="lucide:pencil" className="h-3 w-3" />
      </DialogTrigger>
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
    </Dialog>
  );
}
