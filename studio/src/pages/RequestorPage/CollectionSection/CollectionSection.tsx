import { Button } from "@/components/ui/button";
import { ROOT_ROUTE } from "@/constants";
import { useActiveCollectionId } from "@/hooks/useActiveCollectionId";
import { useCollections } from "@/queries";
import {
  useDeleteCollection,
  useDeleteItemFromCollection,
} from "@/queries/collections";
import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
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
      className={cn("rounded-md", "border", "h-full", "mt-2", BACKGROUND_LAYER)}
    >
      <div className="p-4 grid gap-6">
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_auto]">
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
          <div className="grid grid-cols-[1fr_auto] border-b mb-2 pu-2">
            <h5 className="text-muted-foreground">Current routes:</h5>
            <AddRoute collectionId={collectionId} />
          </div>
          {collection.appRoutes.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2 px-3 mt-2 flex gap-2 items-center flex-col">
              <h4 className="flex items-center gap-2 justify-center text-base">
                <Icon
                  icon="lucide:triangle-alert"
                  className="text-yellow-500"
                />
                Empty collection
              </h4>
              <div className="flex items-center gap-2 max-w-64 flex-col">
                <p className="text-muted-foreground">
                  Awesome, you can now:
                  <ul className="pl-2 list-disc my-4 gap-2 grid">
                    <li>
                      navigate to any route and use the{" "}
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
                </p>
              </div>
            </div>
          ) : (
            <ul className="grid gap-2 pb-4">
              {collection.appRoutes.map((item) => {
                const route = routes.find((r) => r.id === item.appRouteId);
                if (!route) {
                  return null;
                }
                // console.log('route', route, routeId, index);
                return (
                  <li key={item.id} className="grid grid-cols-[1fr_auto]">
                    <div className="grid gap-2 grid-cols-[4rem_auto] ml-6">
                      <Method method={route.method} />
                      {route.path}
                    </div>
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
