import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { useCollections } from "@/queries";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Crumb } from "./useCrumbs";

export function CrumbContent(props: Crumb & { last: boolean }) {
  const { to, label, last, onActivate } = props;
  if (to) {
    return (
      <BreadcrumbLink asChild>
        <li className="flex items-center">
          <Link to={to} className="flex items-center" onClick={onActivate}>
            <LabelContent label={label} last={last} />
          </Link>
        </li>
      </BreadcrumbLink>
    );
  }

  return (
    <BreadcrumbItem>
      <LabelContent label={label} last={last} />
    </BreadcrumbItem>
  );
}

function LabelContent({
  label,
  last,
}: { label: Crumb["label"]; last: boolean }) {
  switch (label.type) {
    case "text": {
      return (
        <span className="flex gap-2 items-center">
          {label.icon && <Icon icon={label.icon} />}
          {label.text}
        </span>
      );
    }
    case "component": {
      const Component = label.Component;
      return (
        <span className="flex gap-2 items-center">
          <Component {...label.props} hideLoading={!last} />
        </span>
      );
    }
  }
}

export function CollectionCrumb({
  collectionId: collectionIdText,
  hideLoading = false,
}: { collectionId: string; hideLoading: boolean }) {
  const { data: collections, isRefetching } = useCollections();
  const collectionId = Number.parseInt(collectionIdText ?? "");

  if (!Number.isNaN(collectionId)) {
    const collection = collections?.find((c) => c.id === collectionId);
    if (collection) {
      return (
        <>
          <Icon icon="lucide:folder" />
          {collection.name}
          {!hideLoading && (
            <LoadingSpinner loading={!hideLoading && isRefetching} />
          )}
        </>
      );
    }
  } else {
    return (
      <>
        <Icon icon="lucide:folder" />
        Not found
      </>
    );
  }
}

/**
 * Makes the loading state sticky (for a minimum duration)
 */
function useStickyLoading(loading: boolean, duration = 300) {
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    if (loading) {
      setSticky(true);
      return;
    }
    const timeout = setTimeout(() => {
      setSticky(false);
    }, duration);
    return () => clearTimeout(timeout);
  }, [loading, duration]);

  return sticky;
}

function LoadingSpinner({ loading }: { loading: boolean }) {
  const sticky = useStickyLoading(loading);

  return (
    <Icon
      icon="lucide:loader-circle"
      className={cn("animate-spin", "transition-opacity", "duration-300", {
        "opacity-0": !sticky,
        "opacity-100": sticky,
      })}
    />
  );
}

export function CollectionItemCrumb({
  collectionId,
  itemId,
  hideLoading,
}: { collectionId: string; itemId: string; hideLoading: boolean }) {
  const { data: collections, isRefetching } = useCollections();

  const collection = collections?.find(
    (item) => item.id.toString() === collectionId,
  );
  const collectionItem = collection?.collectionItems.find(
    (item) => item.id.toString() === itemId,
  );

  const text = collectionItem?.name || "Route";
  return (
    <>
      {text}
      {!hideLoading && (
        <LoadingSpinner loading={!hideLoading && isRefetching} />
      )}
    </>
  );
}
