import { Button } from "@/components/ui/button";
import { useActiveCollectionId } from "@/hooks/useActiveCollectionId";
import { useCollections } from "@/queries";
import {
  type CollectionItem,
  useUpdateCollectionItem,
} from "@/queries/collections";
import { cn } from "@/utils";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { AddRoute } from "../AddRoute";
import type { CollectionWithItems } from "../NavigationPanel/CollectionsPanel/CollectionsPanel";
import { useStudioStore } from "../store";
import { BACKGROUND_LAYER } from "../styles";
import type { ProbedRoute } from "../types";
import { CollectionItemListItem } from "./CollectionItemListItem";
import { EmptyCollectionItemsList } from "./EmptyCollectionItemsList";
import { ManageCollection } from "./ManageCollection";

export function CollectionSection() {
  const collectionId = useActiveCollectionId();

  if (!collectionId) {
    return null;
  }

  const { data: collections, error, isLoading } = useCollections();
  const { appRoutes: routes } = useStudioStore("appRoutes");

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
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-sm text-muted-foreground py-4 px-3 my-2 flex gap-4 items-center flex-col border rounded-lg p-4 bg-background">
          <h4 className="flex items-center gap-3 justify-center text-base">
            <Icon icon="lucide:folder" />
            Collection not found
          </h4>
          <div className="flex max-w-64 flex-col gap-2 text-left">
            <p className="text-muted-foreground">
              Seems like this collection does not exist.
            </p>
          </div>
        </div>
      </div>
    );
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
          <div className="grid grid-cols-[1fr_auto] pe-2 gap-4 items-center">
            <h4 className="flex gap-2">
              <span>{collection.name}</span>
            </h4>
            <ManageCollection
              name={collection.name}
              collectionId={collectionId}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            On this page you can manage your collection
          </p>
        </div>
        <div className="border rounded border-muted grid gap-2 p-2">
          <div className="grid grid-cols-[1fr_auto] border-b mb-2 pb-2">
            <h5 className="text-muted-foreground">Items:</h5>
            <AddRoute collectionId={collectionId} />
          </div>
          {collection.collectionItems.length === 0 ? (
            <EmptyCollectionItemsList collectionId={collectionId} />
          ) : (
            <CollectionItemList
              collection={collection}
              routes={routes}
              collectionId={collectionId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionItemList({
  collection,
  routes,
  collectionId,
}: {
  collection: CollectionWithItems;
  routes: ProbedRoute[];
  collectionId: string;
}) {
  const { mutate } = useUpdateCollectionItem();
  const [list, setList] = useState<string[]>(() =>
    collection.collectionItems.map((item) => item.id.toString()),
  );

  useEffect(() => {
    setList(collection.collectionItems.map((item) => item.id.toString()));
  }, [collection.collectionItems]);
  // const list = useMemo(() => {
  //   return collection.collectionItems.map((item) => item.id.toString());
  // }, [collection.collectionItems]);
  console.log("list", list);
  return (
    <ul className="grid gap-2 pb-2">
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={(event) => {
          console.log("Drag start", event);
        }}
        onDragEnd={(event) => {
          console.log("Drag end", event);
          const activeItem = collection.collectionItems.find(
            (item) => item.id.toString() === event.active.id,
          );
          const overItem = collection.collectionItems.find(
            (item) => item.id.toString() === event.over?.id,
          );
          if (!activeItem || !overItem) {
            return;
          }

          // move active item to new location
          const newList = [...list];
          const activeIndex = newList.indexOf(activeItem.id.toString());
          const overIndex = newList.indexOf(overItem.id.toString());
          newList.splice(activeIndex, 1);
          newList.splice(overIndex, 0, activeItem.id.toString());
          setList(newList);
          mutate({
            collectionId,
            itemId: activeItem.id.toString(),
            extraParams: {
              position: overIndex,
            },
          });
        }}
      >
        <SortableContext items={list} strategy={verticalListSortingStrategy}>
          {list.map((listItem) => {
            const item = collection.collectionItems.find(
              (item) => item.id.toString() === listItem,
            );
            if (!item) {
              return null;
            }
            const route = routes.find((r) => r.id === item.appRouteId);
            if (!route) {
              return null;
            }
            return (
              <Item
                key={item.id}
                route={route}
                item={item}
                collectionId={collectionId}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </ul>
  );
}

function Item(props: {
  route: ProbedRoute;
  item: CollectionItem;
  collectionId: string;
}) {
  const { collectionId, item, route } = props;
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id.toString() });
  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // console.log("Item", item.id, itemStyle, listeners);
  return (
    <li key={item.id} style={itemStyle} ref={setNodeRef}>
      <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
        <Button
          type="button"
          variant="secondary"
          size={"icon-xs"}
          className={"cursor-move"}
          {...attributes}
          {...listeners}
        >
          <Icon icon="lucide:grip-vertical" className="h-4 w-4" />
        </Button>
        <CollectionItemListItem
          key={item.id}
          itemId={item.id}
          name={item.name ?? undefined}
          collectionId={collectionId}
          route={route}
        />
      </div>
    </li>
  );
}
