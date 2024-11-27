import { Button } from "@/components/ui/button";
import { useActiveCollectionId } from "@/hooks/useActiveCollectionId";
import { useCollections } from "@/queries";
import { cn } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { AddRoute } from "../NavigationPanel/CollectionsPanel/AddRoute";
import { Method } from "../RequestorHistory";
import { useRequestorStore } from "../store";
import { BACKGROUND_LAYER } from "../styles";

export function CollectionSection() {
  const collectionId = useActiveCollectionId();

  if (!collectionId) {
    return null;
  }

  const { data: collections, error, isLoading } = useCollections();
  // const { } = useRoutes();
  const { appRoutes: routes } = useRequestorStore("appRoutes");

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

  console.log("collection.appRoutes", collection.appRoutes);

  return (
    <div
      className={cn("rounded-md", "border", "h-full", "mt-2", BACKGROUND_LAYER)}
    >
      <div className="p-4 grid gap-6">
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_auto]">
            <h4>Manage collection</h4>
            <Button variant={"destructive"} type="button" size="icon-xs">
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
                  There are no routes in this collection. Add a route to get
                  started.
                </p>
                <AddRoute collectionId={collectionId} />
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
