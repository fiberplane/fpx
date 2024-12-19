import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { COLLECTION_ROUTE, COLLECTION_WITH_ITEM_ID } from "@/constants";
import { useActiveCollectionId, useActiveCollectionItemId } from "@/hooks";
import { cn, generatePathWithSearchParams } from "@/utils";
import { Icon } from "@iconify/react";
import { memo, useEffect, useRef } from "react";
import { Link, generatePath, useSearchParams } from "react-router-dom";
import { Method } from "../../RequestorHistory";
import { useStudioStore } from "../../store";
import type { CollectionWithItems } from "./CollectionsPanel";

type NavItemProps = {
  collection: CollectionWithItems;
};
export const NavItem = memo(({ collection }: NavItemProps) => {
  const itemRef = useRef<HTMLAnchorElement>(null);
  const { appRoutes: routes } = useStudioStore("appRoutes");

  const [params] = useSearchParams();
  const collectionId = useActiveCollectionId();
  const itemId = useActiveCollectionItemId();
  const isSelected = collectionId === collection.id;
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isSelected]);

  // Create a map of routes for better performance
  const routesMap = new Map(routes.map((route) => [route.id, route]));

  return (
    <div>
      <Link
        ref={itemRef}
        to={generatePathWithSearchParams(
          COLLECTION_ROUTE,
          {
            collectionId: collection.id.toString(),
          },
          params,
        )}
        className={cn(
          "flex gap-2 hover:bg-muted px-2 py-1 rounded cursor-pointer items-center",
          "focus:outline-none",
          {
            "bg-muted": isSelected,
            "hover:bg-muted": !isSelected,
            "focus:ring-1 bg-muted focus:ring-blue-500 focus:ring-opacity-25":
              isSelected,
          },
        )}
        data-state-selected={isSelected}
        id={`item-${collection.id.toString()}`}
      >
        <Icon icon="lucide:folder" className="w-4 h-4 text-gray-400 stroke-1" />
        <div className="flex-1 text-nowrap text-ellipsis overflow-hidden text-muted-foreground">
          {collection.name}
        </div>
      </Link>
      <div className="grid gap-1 my-2">
        {collection.collectionItems.map((item) => {
          const { id, appRouteId } = item;
          const route = routesMap.get(appRouteId);
          if (!route) {
            return null;
          }

          return (
            <Link
              to={{
                pathname: generatePath(COLLECTION_WITH_ITEM_ID, {
                  collectionId: collection.id.toString(),
                  itemId: id.toString(),
                }),
                search: params.toString(),
              }}
              key={item.id}
              className={cn(
                "grid gap-2 grid-cols-[auto_1fr] ml-6 mr-1 hover:bg-muted px-2 py-1 rounded cursor-pointer",
                "font-mono text-sm",
                {
                  "bg-muted": itemId === item.id,
                },
              )}
            >
              <Method
                method={route.method}
                className="text-xs font-mono min-w-12"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate">{item.name || route.path}</span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <span>{item.name || route.path}</span>
                </TooltipContent>
              </Tooltip>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
