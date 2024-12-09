import { COLLECTION_ROUTE, COLLECTION_WITH_ROUTE_ID } from "@/constants";
import { useActiveCollectionEntryId } from "@/hooks";
import { cn, generatePathWithSearchParams } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { memo, useEffect, useRef } from "react";
import { Link, generatePath, useSearchParams } from "react-router-dom";
import { Method } from "../../RequestorHistory";
import { useStudioStore } from "../../store";
import type { CollectionWithItems } from "./CollectionsPanel";

type NavItemProps = {
  collection: CollectionWithItems;
};
export const NavItem = memo(
  ({
    // to,
    collection,
    // collectionId,
    // isSelected, collectionId
  }: NavItemProps) => {
    // const id = useActiveTraceId();
    const itemRef = useRef<HTMLAnchorElement>(null);
    const { appRoutes: routes } = useStudioStore("appRoutes");

    const [params] = useSearchParams();
    const entryId = useActiveCollectionEntryId();
    const [searchParams] = useSearchParams();
    const isSelected = entryId === collection.id.toString();
    useEffect(() => {
      if (isSelected && itemRef.current) {
        itemRef.current.focus();
      }
    }, [isSelected]);

    const matchesId = isSelected;
    return (
      <div>
        <Link
          ref={itemRef}
          to={generatePathWithSearchParams(
            COLLECTION_ROUTE,
            {
              collectionId: collection.id.toString(),
            },
            searchParams,
          )}
          className={cn(
            "flex gap-2 hover:bg-muted px-2 py-1 rounded cursor-pointer items-center",
            "focus:outline-none",
            {
              "bg-muted": matchesId,
              "hover:bg-muted": !matchesId,
              "focus:ring-1 bg-muted focus:ring-blue-500 focus:ring-opacity-25 focus:ring-inset":
                !matchesId && isSelected,
            },
          )}
          onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          data-state-active={matchesId}
          data-state-selected={isSelected}
          id={`item-${collection.id.toString()}`}
        >
          <Icon
            icon="lucide:folder"
            className="w-4 h-4 text-gray-400 stroke-1"
          />
          <div className="flex-1 text-nowrap text-ellipsis overflow-hidden text-muted-foreground">
            {collection.name}
          </div>
        </Link>
        <div className="grid gap-1 my-2">
          {collection.collectionItems.map((item) => {
            const { id, appRouteId } = item;
            const route = routes.find((r) => r.id === appRouteId);
            if (!route) {
              return null;
            }

            return (
              <Link
                to={{
                  pathname: generatePath(COLLECTION_WITH_ROUTE_ID, {
                    collectionId: collection.id.toString(),
                    entryId: id.toString(),
                  }),
                  search: params.toString(),
                }}
                key={item.id}
                className={cn(
                  "grid gap-2 grid-cols-[auto_1fr] ml-6 mr-1 hover:bg-muted px-2 py-1 rounded cursor-pointer",
                  "font-mono text-sm",
                  {
                    "bg-muted": entryId === item.id.toString(),
                  },
                )}
                tabIndex={0}
              >
                <Method
                  method={route.method}
                  className="text-xs font-mono min-w-12"
                />
                <span>{item.name || route.path}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  },
);
