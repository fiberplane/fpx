import { COLLECTION_ROUTE } from "@/constants";
import {
  useActiveCollectionId,
  useActiveCollectionItemId,
  useActiveTraceId,
} from "@/hooks";
import type { IconProps } from "@iconify/react";
import type { ComponentType } from "react";
import { type To, generatePath, useSearchParams } from "react-router-dom";
import { useStudioStore } from "../store";
import { CollectionCrumb, CollectionItemCrumb } from "./CrumbContent";

type LabelTextWithIcon = {
  type: "text";
  icon?: IconProps["icon"];
  text: string;
};

type HideLoadingProps = { hideLoading: boolean };

// biome-ignore lint/suspicious/noExplicitAny: hack: this was the only way to get this to work
type LabelComponent<P = any> = {
  type: "component";
  Component: ComponentType<Omit<P, "hideLoading"> & HideLoadingProps>;
  props: Omit<P, "hideLoading">;
};
type Label = LabelTextWithIcon | LabelComponent;

export type Crumb = {
  label: Label;
  to?: To;
  onActivate?: () => void;
};

export function useCrumbs(): Array<Crumb> {
  const collectionId = useActiveCollectionId();
  const traceId = useActiveTraceId();
  const itemId = useActiveCollectionItemId();
  const { activeRoute, updatePath, updateMethod } = useStudioStore(
    "activeRoute",
    "updatePath",
    "updateMethod",
  );

  const [searchParams] = useSearchParams();
  const flattenedParams = searchParams.toString();

  const crumbs: Array<Crumb> = [
    {
      label: {
        type: "text",
        text: "Home",
      },
      to: { pathname: "/" },
      onActivate: () => {
        updatePath("/");
        updateMethod("GET");
      },
    },
  ];

  if (collectionId !== null) {
    const collectionLink: To = {
      pathname: generatePath(COLLECTION_ROUTE, {
        collectionId: collectionId.toString(),
      }),
      search: flattenedParams ? `?${flattenedParams}` : "",
    };

    const props = { collectionId };
    const label: LabelComponent<typeof props> = {
      type: "component",
      Component: CollectionCrumb,
      props,
    };

    crumbs.push({
      label,
      to: !itemId ? collectionLink : undefined,
    });
  }

  if (itemId && collectionId) {
    const props = { collectionId: collectionId, itemId: itemId };
    const label: LabelComponent<typeof props> = {
      type: "component",
      Component: CollectionItemCrumb,
      props,
    };
    crumbs.push({
      label,
    });
  } else if ((activeRoute && !collectionId) || traceId) {
    crumbs.push({
      label: {
        type: "text",
        text: "Route",
      },
    });
  }

  return crumbs;
}
