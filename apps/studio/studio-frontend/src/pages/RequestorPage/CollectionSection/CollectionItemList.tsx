import { Button } from "@/components/ui/button";
import {
  type CollectionItem,
  useUpdateCollectionItem,
} from "@/queries/collections";
import { cn } from "@/utils";
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import type { CollectionWithItems } from "../NavigationPanel/CollectionsPanel/CollectionsPanel";
import type { ProbedRoute } from "../types";
import { CollectionItemListItem } from "./CollectionItemListItem";

export function CollectionItemList({
  collection,
  routes,
  collectionId,
}: {
  collection: CollectionWithItems;
  routes: ProbedRoute[];
  collectionId: number;
}) {
  const { mutate: syncCollectionItem } = useUpdateCollectionItem();

  const [list, setList] = useState<Array<string>>(() =>
    collection.collectionItems.map((item) => item.id.toString()),
  );

  useEffect(() => {
    setList(collection.collectionItems.map((item) => item.id.toString()));
  }, [collection.collectionItems]);

  const onDragEnd = (event: DragEndEvent) => {
    // Handle drag end event
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
    syncCollectionItem({
      collectionId,
      itemId: activeItem.id,
      extraParams: {
        position: overIndex,
      },
    });
  };

  return (
    <ul className="grid gap-1 pb-2">
      <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
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

export function Item(props: {
  route: ProbedRoute;
  item: CollectionItem;
  collectionId: number;
}) {
  const { collectionId, item, route } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id.toString(),
    transition: {
      duration: 150, // milliseconds
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });
  const itemStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li style={itemStyle} ref={setNodeRef}>
      <div
        className={cn(
          "grid grid-cols-[auto_1fr] gap-2 items-center py-1",
          "transition-shadow duration-150",
          "rounded-md hover:bg-muted shadow-none",
          {
            "shadow-2xl": isDragging,
          },
        )}
      >
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
