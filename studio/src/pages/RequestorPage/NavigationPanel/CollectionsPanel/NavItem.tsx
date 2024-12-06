import { COLLECTION_ROUTE, COLLECTION_WITH_ROUTE_ID } from "@/constants";
import { useActiveCollectionEntryId } from "@/hooks";
import { generatePathWithSearchParams, cn } from "@/utils";
import { Icon } from "@iconify/react/dist/iconify.js";
import { memo, useRef, useEffect } from "react";
import { useSearchParams, Link, generatePath } from "react-router-dom";
import { Method } from "../../RequestorHistory";
import { useStudioStore } from "../../store";
import { CollectionWithAppRoute } from "./CollectionsPanel";

type NavItemProps = {
  collection: CollectionWithAppRoute;
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
    const {
      appRoutes: routes, updateMethod, updatePath, setRequestParams,
    } = useStudioStore(
      "appRoutes",
      "updatePath",
      "updateMethod",
      "setRequestParams"
    );

    const [params] = useSearchParams();
    const entryId = useActiveCollectionEntryId();
    const [searchParams] = useSearchParams();
    const isSelected = entryId === collection.id.toString();
    useEffect(() => {
      if (isSelected && itemRef.current) {
        itemRef.current.focus();
      }
    }, [isSelected]);

    // const matchesId = getId(item) === id;
    const matchesId = isSelected;
    console.log("matchesId", matchesId);
    return (
      <div>
        <Link
          ref={itemRef}
          to={generatePathWithSearchParams(
            COLLECTION_ROUTE,
            {
              collectionId: collection.id.toString(),
            },
            searchParams
          )}
          className={cn(
            "flex gap-2 hover:bg-muted px-2 py-1 rounded cursor-pointer items-center",
            "focus:outline-none",
            {
              "bg-muted": matchesId,
              "hover:bg-muted": !matchesId,
              "focus:ring-1 bg-muted focus:ring-blue-500 focus:ring-opacity-25 focus:ring-inset": !matchesId && isSelected,
            }
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
            className="w-4 h-4 text-gray-400 stroke-1" />
          <div className="flex-1 text-nowrap text-ellipsis overflow-hidden text-muted-foreground">
            {collection.name}
          </div>
        </Link>
        <div className="grid gap-1">
          {collection.collectionItems.map((item) => {
            const { id, appRouteId, ...extraParams } = item;
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
                  "grid gap-2 grid-cols-[4rem_auto] ml-6 hover:bg-muted px-2 py-1 rounded cursor-pointer",
                  {
                    "bg-muted": entryId === item.id.toString(),
                  }
                )}
                onClick={() => {
                  console.log("click", extraParams);
                  setRequestParams({
                    ...extraParams,
                    requestUrl: `http://localhost:8787${route.path}`,
                    requestMethod: route.method,
                    requestRoute: appRouteId.toString(),
                  });
                  updateMethod(route.method);
                  // updatePath(route.path);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateMethod(route.method);
                    updatePath(route.path);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                <Method method={route.method} />
                <span className="font-mono">{item.name || route.path}</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }
);
