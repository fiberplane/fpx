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

  const searchRef = useRef<HTMLInputElement>(null);

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
          <CreateCollection />
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
      </div>
    </div>
  );
}
