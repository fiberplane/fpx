import { COLLECTION_ROUTE, COLLECTION_WITH_ROUTE_ID } from "@/constants";
import {
  useActiveCollectionEntryId,
  //  useActiveCollectionId
} from "@/hooks";
import { type CollectionWithAppRouteList, useCollections } from "@/queries";
import {
  cn,
  generatePathWithSearchParams,
  // generatePathWithSearchParams
} from "@/utils";
// import type { Collection } from "@fiberplane/fpx-types";
import { Icon } from "@iconify/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  // type To,
  generatePath,
  // useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Method } from "../../RequestorHistory";
import { useStudioStore } from "../../store";
import { Search } from "../Search";
import { CreateCollection } from "./CreateCollection";
// import { useHandler } from "@fiberplane/hooks";
// import { getId } from "@/components/Timeline/DetailsList/TimelineDetailsList/utils";

type CollectionWithAppRoute = CollectionWithAppRouteList[0];
export function CollectionsPanel() {
  // const { history: items } = useRequestorHistory();
  const { data: items, error: collectionsError } = useCollections();
  const [filterValue, setFilterValue] = useState("");
  const hasDataRef = useRef(false);
  const hadData = hasDataRef.current;

  // if (collectionsError) {
  //   console.error(collectionsError);
  // } else {
  //   console.log("items", items);
  // }
  if (hasDataRef.current === false && items) {
    hasDataRef.current = true;
  }
  const filteredItems = useMemo(() => {
    if (!items) {
      return [];
    }

    return items.filter((item) => {
      return item.name.toLowerCase().includes(filterValue.toLowerCase());
    });
  }, [items, filterValue]);

  // const id = useActiveTraceId();

  // const activeIndex = useMemo(() => {
  //   return filteredItems.findIndex((item) => getId(item) === id);
  // }, [filteredItems, id]);
  const selectedItemId = useActiveCollectionEntryId();
  // const collectionId = useActiveCollectionId();
  // const navigate = useNavigate();
  // const [searchParams] = useSearchParams();
  // const setSelectedItemId = useHandler((id: string | null) => {
  //   if (!id || !collectionId) {
  //     return;
  //   }

  //   navigate(
  //     generatePathWithSearchParams(
  //       COLLECTION_WITH_ROUTE_ID,
  //       {
  //         collectionId,
  //         entryId: id,
  //       },
  //       searchParams,
  //     ),
  //   );
  // });
  // const [selectedItemId, setSelectedItemId] = useState<string | null>(() => {
  //   return null;
  //   // return activeIndex !== -1 ? getId(filteredItems[activeIndex]) : null;
  // });

  // const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);

  // const handleItemSelect = useCallback(
  //   (item: Collection) => {
  //     navigate({
  //       pathname: `/collections/${getId(item)}`,
  //       search: searchParams.toString(),
  //     });
  //   },
  //   [navigate, searchParams],
  // );

  // const { isInputFocused, blurActiveInput } = useInputFocusDetection();

  // const getNextItemIndex = (currentIndex: number, direction: 1 | -1) => {
  //   let nextIndex = currentIndex + direction;
  //   if (nextIndex < 0) {
  //     nextIndex = filteredItems.length - 1;
  //   } else if (nextIndex >= filteredItems.length) {
  //     nextIndex = 0;
  //   }
  //   return nextIndex;
  // };

  // useHotkeys(["j", "k", "/"], (event) => {
  //   event.preventDefault();
  //   switch (event.key) {
  //     case "j":
  //       setSelectedItemId((prevId) => {
  //         const currentIndex = filteredItems.findIndex(
  //           (item) => getId(item) === prevId,
  //         );
  //         const nextIndex = getNextItemIndex(currentIndex, 1);
  //         return getId(filteredItems[nextIndex]);
  //       });
  //       break;
  //     case "k":
  //       setSelectedItemId((prevId) => {
  //         const currentIndex = filteredItems.findIndex(
  //           (item) => getId(item) === prevId,
  //         );
  //         const nextIndex = getNextItemIndex(currentIndex, -1);
  //         return getId(filteredItems[nextIndex]);
  //       });
  //       break;
  //     case "/": {
  //       if (searchRef.current) {
  //         searchRef.current.focus();
  //         setSelectedItemId(null);
  //       }
  //       break;
  //     }
  //   }
  // });

  // useHotkeys(
  //   ["Escape", "Enter"],
  //   (event) => {
  //     console.log('warm keys', event.key, isInputFocused)
  //     switch (event.key) {
  //       case "Enter": {
  //         if (isInputFocused && filteredItems.length > 0) {
  //           setSelectedItemId(getId(filteredItems[0]));
  //           const firstItemElement = document.getElementById(
  //             `item-${getId(filteredItems[0])}`,
  //           );
  //           if (firstItemElement) {
  //             firstItemElement.focus();
  //           }
  //           break;
  //         }

  //         if (selectedItemId !== null) {
  //           const selectedItem = filteredItems.find(
  //             (item) => getId(item) === selectedItemId,
  //           );
  //           if (selectedItem) {
  //             handleItemSelect(selectedItem);
  //           }
  //         }
  //         break;
  //       }

  //       case "Escape": {
  //         if (isInputFocused) {
  //           blurActiveInput();
  //           break;
  //         }
  //         if (filterValue) {
  //           setFilterValue("");
  //           break;
  //         }

  //         setSelectedItemId(id);
  //         break;
  //       }
  //     }
  //   },
  //   { enableOnFormTags: ["input"] },
  // );
  console.log("selectedItemId", selectedItemId);
  if (collectionsError) {
    return <div>Error: {collectionsError.message}</div>;
  }

  return (
    <div
      className={cn("h-full", "flex", "flex-col", {
        hadData,
      })}
    >
      <div>
        <div className="flex items-center space-x-2 pb-3">
          <Search
            ref={searchRef}
            value={filterValue}
            onChange={setFilterValue}
            onFocus={() => {
              // setSelectedItemId(null);
            }}
            placeholder="collections"
            onItemSelect={() => {}}
            itemCount={filteredItems.length}
          />
          <CreateCollection
          // selectCollection={(collection: Collection) => {
          //   // const id = getId(collection);
          //   // setSelectedItemId(id);
          // }}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-full relative">
        {filteredItems.length === 0 && <EmptyState />}
        <div className="grid gap-2">
          {filteredItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              // searchParams={searchParams}
              // collectionId={item.id.toString()}
              // to={{
              //   pathname: `/collections/${item.id.toString()}`,
              //   search: searchParams.toString(),
              // }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300 h-full">
      <div className="py-8 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:folder"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-4">No collections found</h2>
        {/* <div className="text-gray-400 text-left text-sm flex flex-col gap-4">
          <ol className="flex flex-col gap-2">
            <li>
              1. Make sure your app is running and connected to the Fiberplane
              Studio using the client library
            </li>
            <li className="mt-2">
              2. Send an API request to one your app's endpoints
            </li>
            <li className="mt-2">3. Requests will appear here automatically</li>
          </ol>
          <p className="text-gray-400 text-sm">
            If requests are still not appearing:
          </p>
          <ul className="text-left text-sm text-gray-400">
            <li>
              - Ask for help on{" "}
              <a
                href="https://discord.com/invite/cqdY6SpfVR"
                className="underline"
              >
                Discord
              </a>
            </li>
            <li>
              - File an issue on{" "}
              <a
                href="https://github.com/fiberplane/fpx/issues"
                className="underline"
              >
                Github
              </a>
            </li>
          </ul>
        </div> */}
      </div>
    </div>
  );
}

type NavItemProps = {
  item: CollectionWithAppRoute;
  // isSelected: boolean;
  // to: To;
  // searchParams: URLSearchParams;
  // setSelectedItemId: (id: string) => void;
  // collectionId: string;
};

const NavItem = memo(
  ({
    // to,
    item,
    // collectionId,
    // isSelected, collectionId
  }: NavItemProps) => {
    // const id = useActiveTraceId();
    const itemRef = useRef<HTMLAnchorElement>(null);
    const {
      appRoutes: routes,
      updateMethod,
      updatePath,
      setRequestParams,
    } = useStudioStore(
      "appRoutes",
      "updatePath",
      "updateMethod",
      "setRequestParams",
    );

    const [params] = useSearchParams();
    const entryId = useActiveCollectionEntryId();
    const [searchParams] = useSearchParams();
    const isSelected = entryId === item.id.toString();
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
              collectionId: item.id.toString(),
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
          id={`item-${item.id.toString()}`}
        >
          <Icon
            icon="lucide:folder"
            className="w-4 h-4 text-gray-400 stroke-1"
          />
          <div className="flex-1 text-nowrap text-ellipsis overflow-hidden text-muted-foreground">
            {item.name}
          </div>
        </Link>
        <div className="grid gap-1">
          {item.collectionItems.map((item) => {
            const { id, appRouteId, ...extraParams } = item;
            const route = routes.find((r) => r.id === appRouteId);
            if (!route) {
              return null;
            }

            return (
              <Link
                to={{
                  pathname: generatePath(COLLECTION_WITH_ROUTE_ID, {
                    collectionId: item.id.toString(),
                    entryId: id.toString(),
                  }),
                  search: params.toString(),
                }}
                key={item.id}
                className={cn(
                  "grid gap-2 grid-cols-[4rem_auto] ml-6 hover:bg-muted px-2 py-1 rounded cursor-pointer",
                  {
                    "bg-muted": entryId === item.id.toString(),
                  },
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
  },
);
