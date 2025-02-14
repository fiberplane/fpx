import { type CollectionWithItemsList, useCollections } from "@/queries";
import { cn, noop } from "@/utils";
import { useMemo, useRef, useState } from "react";
import { Search } from "../Search";
import { CreateCollection } from "./CreateCollection";
import { EmptyCollectionPanel } from "./EmptyCollectionPanel";
import { NavItem } from "./NavItem";

export type CollectionWithItems = CollectionWithItemsList[0];

export function CollectionsPanel() {
  const { data: collections, error: collectionsError } = useCollections();
  const [filterValue, setFilterValue] = useState("");
  const hasDataRef = useRef(false);
  const previouslyHadData = hasDataRef.current;

  if (!hasDataRef.current && collections) {
    hasDataRef.current = true;
  }
  const filteredItems = useMemo(() => {
    if (!collections) {
      return [];
    }

    return collections.filter((item) =>
      item.name.toLowerCase().includes(filterValue.toLowerCase()),
    );
  }, [collections, filterValue]);

  const searchRef = useRef<HTMLInputElement>(null);

  if (collectionsError) {
    return <div>Error: {collectionsError.message}</div>;
  }

  return (
    <div
      className={cn(
        `h-full flex flex-col ${previouslyHadData ? "previouslyHadData" : ""}`,
      )}
    >
      <div>
        <div className="flex items-center space-x-2 pb-3">
          <Search
            ref={searchRef}
            value={filterValue}
            onChange={setFilterValue}
            onFocus={noop}
            onItemSelect={noop}
            itemCount={filteredItems.length}
          />
          <CreateCollection />
        </div>
      </div>
      <div className="overflow-y-auto h-full relative">
        {filteredItems.length === 0 && <EmptyCollectionPanel />}
        <div className="grid gap-2">
          {filteredItems.map((collection) => (
            <NavItem key={collection.id} collection={collection} />
          ))}
        </div>
      </div>
    </div>
  );
}
