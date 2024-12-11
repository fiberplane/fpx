import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ROOT_ROUTE } from "@/constants";
import {
  useDeleteCollection,
  useUpdateCollection,
} from "@/queries/collections";
import { Icon } from "@iconify/react";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { generatePath, useNavigate, useSearchParams } from "react-router-dom";
import { CollectionForm } from "../CollectionForm";

export function ManageCollection(props: {
  name: string;
  collectionId: string;
}) {
  const { name, collectionId } = props;
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [triggerRename, setRenameOpen] = useState(false);

  const { mutate, error, isPending } = useUpdateCollection();
  const { mutate: deleteCollection } = useDeleteCollection(collectionId);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return (
    <>
      <DropdownMenu onOpenChange={setOpen} open={open}>
        <DropdownMenuTrigger asChild>
          <Button size="icon-xs" variant="ghost">
            <Icon icon="lucide:ellipsis" className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <CustomDropdownItem onSelect={() => setRenameOpen(true)}>
            <span>Rename</span>
            <Icon icon="lucide:pencil" className="h-4 w-4" />
          </CustomDropdownItem>
          <CustomDropdownItem onSelect={() => setConfirmDelete(true)}>
            <span>Delete</span>
            <Icon icon="lucide:trash-2" className="h-4 w-4" />
          </CustomDropdownItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={triggerRename} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-screen-sm w-96">
          <CollectionForm
            onSubmit={(data) => {
              mutate({
                collectionId,
                params: data,
              });
              setRenameOpen(false);
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
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <ConfirmationDialog
          title={
            <>
              Delete{" "}
              <span className="text-muted-foreground">{name || "no name"}</span>{" "}
              from collection?
            </>
          }
          description="This action cannot be undone."
          confirmText="Delete"
          onConfirm={() => {
            deleteCollection();
            setConfirmDelete(false);
            navigate({
              pathname: generatePath(ROOT_ROUTE, {}),
              search: searchParams.toString(),
            });
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      </Dialog>
    </>
  );
}

function CustomDropdownItem(props: {
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenuItem
      onSelect={props.onSelect}
      className="grid grid-cols-[1fr_auto] gap-2"
    >
      {props.children}
    </DropdownMenuItem>
  );
}
