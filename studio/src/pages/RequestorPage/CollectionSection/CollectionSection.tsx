import { Button } from "@/components/ui/button";
import { COLLECTION_WITH_ROUTE_ID, ROOT_ROUTE } from "@/constants";
import { useActiveCollectionId } from "@/hooks/useActiveCollectionId";
import { useCollections } from "@/queries";
import {
  useDeleteCollection,
  useDeleteItemFromCollection,
} from "@/queries/collections";
import { cn, generatePathWithSearchParams } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  Link,
  type To,
  generatePath,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AddRoute } from "../NavigationPanel/CollectionsPanel/AddRoute";
import { Method } from "../RequestorHistory";
import { useStudioStore } from "../store";
import { BACKGROUND_LAYER } from "../styles";

export function CollectionSection() {
  const collectionId = useActiveCollectionId();

  if (!collectionId) {
    return null;
  }

  const { data: collections, error, isLoading } = useCollections();
  const { appRoutes: routes } = useStudioStore("appRoutes");
  const { mutate: deleteItem } = useDeleteItemFromCollection(collectionId);
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
          <div className="grid grid-cols-[1fr_auto] items-center">
            <h4>Manage collection</h4>
            <Button
              variant={"destructive"}
              type="button"
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
            <h5 className="text-muted-foreground">Current items:</h5>
            <AddRoute collectionId={collectionId} />
          </div>
          {collection.collectionItems.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2 px-3 my-2 flex gap-4 items-center flex-col">
              <h4 className="flex items-center gap-3 justify-center text-base">
                <Icon icon="lucide:info" className="text-green-500" />
                Empty collection
              </h4>
              <div className="flex max-w-64 flex-col gap-1 text-left">
                <p className="text-muted-foreground">Awesome, you can now:</p>
                <ul className="ml-1.5 pl-2 list-disc my-2 gap-2 grid">
                  <li>
                    navigate to any route and use the&nbsp;&nbsp;
                    <Icon
                      icon="lucide:folder"
                      className="text-foreground inline-block"
                    />{" "}
                    to add it the collection
                  </li>
                  <li>
                    or add a route using the following button
                    <AddRoute collectionId={collectionId} />
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <ul className="grid gap-2 pb-2">
              {collection.collectionItems.map((item) => {
                const route = routes.find((r) => r.id === item.appRouteId);
                if (!route) {
                  return null;
                }

                return (
                  <li
                    key={item.id}
                    className="grid grid-cols-[1fr_auto] gap-2 items-center"
                  >
                    <Link
                      to={generatePathWithSearchParams(
                        COLLECTION_WITH_ROUTE_ID,
                        {
                          collectionId: collectionId,
                          entryId: item.id.toString(),
                        },
                        searchParams,
                      )}
                      className="grid gap-2 px-2 rounded-md grid-cols-[4rem_1fr_1fr] hover:bg-muted"
                    >
                      <Method method={route.method} />
                      <span>{route.path}</span>
                      <span>{item.name}</span>
                    </Link>
                    <Button
                      variant={"destructive"}
                      type="button"
                      size="icon-xs"
                      onClick={() => {
                        deleteItem({ itemId: item.id });
                      }}
                    >
                      <Icon icon="lucide:trash-2" className="h-3 w-3" />
                    </Button>
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
