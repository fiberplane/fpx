import { Button } from "@/components/ui/button";
import { ROOT_ROUTE } from "@/constants";
import { useActiveCollectionId } from "@/hooks/useActiveCollectionId";
import { useCollections } from "@/queries";
import { useDeleteCollection } from "@/queries/collections";
import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react";
import {
  type To,
  generatePath,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
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
  const { mutate: deleteCollection } = useDeleteCollection(collectionId);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const navigateHome = useHandler(() => {
    const to: To = {
      pathname: generatePath(ROOT_ROUTE, {}),
      search: searchParams.toString(),
    };
    navigate(to);
  });

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
    return <div>Collection not found</div>;
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
              <ManageCollection
                name={collection.name}
                collectionId={collectionId}
              />
            </h4>
            <Button
              variant={"destructive"}
              size="icon-xs"
              onClick={() =>
                deleteCollection(undefined, {
                  onSuccess: navigateHome,
                })
              }
            >
              <Icon icon="lucide:trash-2" className="h-3 w-3" />
            </Button>
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
