import { type CollectionWithItemsList, useCollections } from "@/queries";
import { cn, noop } from "@/utils";
import { Icon } from "@iconify/react";
import { useMemo, useRef, useState } from "react";
import { Search } from "../Search";
import { CreateCollection } from "./CreateCollection";
import { NavItem } from "./NavItem";

export type CollectionWithItems = CollectionWithItemsList[0];

export function CollectionsPanel() {
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
  // const selectedItemId = useActiveCollectionEntryId();
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
            onItemSelect={noop}
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
          {filteredItems.map((collection) => (
            <NavItem key={collection.id} collection={collection} />
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
