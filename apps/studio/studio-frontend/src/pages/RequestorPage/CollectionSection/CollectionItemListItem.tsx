import { Icon } from "@iconify/react";
import { Link, generatePath, useSearchParams } from "react-router-dom";

import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COLLECTION_WITH_ITEM_ID } from "@/constants";
import {
  useDeleteItemFromCollection,
  useUpdateCollectionItem,
} from "@/queries/collections";
import { useState } from "react";
import { NamingRouteForm } from "../NamingRouteForm";
import { Method } from "../RequestorHistory";
import type { ProbedRoute } from "../types";

export function CollectionItemListItem({
  itemId,
  name,
  collectionId,
  route,
}: {
  itemId: number;
  name: string | undefined;
  route: ProbedRoute;
  collectionId: number;
}) {
  const { mutate: deleteItem } = useDeleteItemFromCollection(collectionId);
  const { mutate: updateItem } = useUpdateCollectionItem();
  const {
    mutate: renameItem,
    error: renameError,
    isPending: isRenamePending,
  } = useUpdateCollectionItem();
  const [searchParams] = useSearchParams();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
      <Link
        to={{
          pathname: generatePath(COLLECTION_WITH_ITEM_ID, {
            collectionId: collectionId.toString(),
            itemId: itemId.toString(),
          }),
          search: searchParams.toString(),
        }}
        className="grid gap-2 px-2 grid-cols-[4rem_1fr_1fr] rounded-md items-center hover:bg-muted"
      >
        <Method className="text-sm" method={route.method} />
        <span className="text-sm font-mono">{route.path}</span>
        <span className="text-sm">{name}</span>
      </Link>
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
            deleteItem({
              itemId,
            });
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      </Dialog>
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-screen-sm w-96">
          <NamingRouteForm
            error={renameError}
            isPending={isRenamePending}
            initialData={{
              name,
            }}
            onSubmit={(data) => {
              renameItem({
                itemId,
                collectionId,
                extraParams: data,
              });
              setRenameOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"secondary"} size="icon-xs">
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
          <CustomDropdownItem
            onSelect={() => {
              updateItem({
                collectionId,
                itemId,
                extraParams: {
                  position: 0,
                },
              });
            }}
          >
            <span>Move to top</span>
            <Icon icon="lucide:arrow-up-to-line" className="h-4 w-4" />
          </CustomDropdownItem>
          <CustomDropdownItem
            onSelect={() => {
              updateItem({
                collectionId,
                itemId,
                extraParams: {
                  position: Number.MAX_SAFE_INTEGER,
                },
              });
            }}
          >
            <span>Move to bottom</span>
            <Icon icon="lucide:arrow-down-to-line" className="h-4 w-4" />
          </CustomDropdownItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
