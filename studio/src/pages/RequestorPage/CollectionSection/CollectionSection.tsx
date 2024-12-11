import { useActiveCollectionId } from "@/hooks/useActiveCollectionId";
import { useCollections } from "@/queries";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";
import { AddRoute } from "../AddRoute";
import { useStudioStore } from "../store";
import { BACKGROUND_LAYER } from "../styles";
import { CollectionItemListItem } from "./CollectionItemListItem";
import { EmptyCollectionItemsList } from "./EmptyCollectionItemsList";
import { ManageCollection } from "./ManageCollection";

export function CollectionSection() {
  const collectionId = useActiveCollectionId();

  if (!collectionId) {
    return null;
  }

  const { data: collections, error, isLoading } = useCollections();
  const { appRoutes: routes } = useStudioStore("appRoutes");

  if (error) {
    return <div>{error.message}</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const collection = collections?.find(
    (c) => c.id === Number.parseInt(collectionId),
  );
  if (!collection) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground py-4 px-3 my-2 flex gap-4 items-center flex-col border rounded-lg p-4 bg-background">
          <h4 className="flex items-center gap-3 justify-center text-base">
            <Icon icon="lucide:folder" />
            Collection not found
          </h4>
          <div className="flex max-w-64 flex-col gap-2 text-left">
            <p className="text-muted-foreground">
              Seems like this collection does not exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md border",
        "h-full flex-auto overflow-x-hidden overflow-y-auto",
        BACKGROUND_LAYER,
      )}
    >
      <div className="p-4 grid gap-6">
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_auto] pe-2 gap-4 items-center">
            <h4 className="flex gap-2">
              <span>{collection.name}</span>
            </h4>
            <ManageCollection
              name={collection.name}
              collectionId={collectionId}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            On this page you can manage your collection
          </p>
        </div>
        <div className="border rounded border-muted grid gap-2 p-2">
          <div className="grid grid-cols-[1fr_auto] border-b mb-2 pb-2">
            <h5 className="text-muted-foreground">Items:</h5>
            <AddRoute collectionId={collectionId} />
          </div>
          {collection.collectionItems.length === 0 ? (
            <EmptyCollectionItemsList collectionId={collectionId} />
          ) : (
            <ul className="grid gap-2 pb-2">
              {collection.collectionItems.map((item) => {
                const route = routes.find((r) => r.id === item.appRouteId);
                if (!route) {
                  return null;
                }

                return (
                  <li key={item.id}>
                    <CollectionItemListItem
                      key={item.id}
                      itemId={item.id}
                      name={item.name ?? undefined}
                      collectionId={collectionId}
                      route={route}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
