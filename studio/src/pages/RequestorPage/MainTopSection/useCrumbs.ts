import { COLLECTION_ROUTE } from "@/constants";
import {
  useActiveCollectionEntryId,
  useActiveCollectionId,
  useActiveTraceId,
} from "@/hooks";
import { useCollections } from "@/queries";
import type { IconProps } from "@iconify/react";
import { generatePath, useSearchParams } from "react-router-dom";
import { useStudioStore } from "../store";

export type Crumb = {
  label:
    | string
    | {
        icon: IconProps["icon"];
        text: string;
      };
  href?: string;
  onActivate?: () => void;
};
export function useCrumbs(): Crumb[] {
  const collectionIdText = useActiveCollectionId();
  const traceId = useActiveTraceId();
  const entryId = useActiveCollectionEntryId();
  const { activeRoute, updatePath, updateMethod } = useStudioStore(
    "activeRoute",
    "updatePath",
    "updateMethod",
  );

  const [searchParams] = useSearchParams();
  const flattenedParams = searchParams.toString();

  const { data: collections } = useCollections();
  const collectionId = Number.parseInt(collectionIdText ?? "");
  const crumbs: Crumb[] = [
    {
      label: "Home",
      href: "/",
      onActivate: () => {
        updatePath("/");
        updateMethod("GET");
      },
    },
  ];

  if (!Number.isNaN(collectionId)) {
    const collectionLink = `${generatePath(COLLECTION_ROUTE, {
      collectionId: collectionId.toString(),
    })}${flattenedParams ? `?${flattenedParams}` : ""}`;
    const collection = collections?.find((c) => c.id === collectionId);
    if (collection) {
      crumbs.push({
        label: {
          icon: "lucide:folder",
          text: collection.name,
        },
        href: collectionLink,
      });
    } else {
      crumbs.push({ label: "Collection", href: collectionLink });
    }
  }

  if (entryId && collectionId) {
    const collection = collections?.find((item) => item.id === collectionId);
    const collectionItem = collection?.collectionItems.find(
      (item) => item.id.toString() === entryId,
    );
    const label = collectionItem?.name || "Route";
    crumbs.push({ label });
  } else if ((activeRoute && !collectionId) || traceId) {
    crumbs.push({ label: "Route" });
  }

  return crumbs;
}
