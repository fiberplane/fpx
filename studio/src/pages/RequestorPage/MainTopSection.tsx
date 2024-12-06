import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { COLLECTION_ROUTE } from "@/constants";
import { useActiveCollectionEntryId, useActiveCollectionId } from "@/hooks";
import { useActiveTraceId } from "@/hooks";
import { useCollections } from "@/queries";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Fragment } from "react";
import type { ReactNode } from "react";
import {
  Link,
  Route,
  Routes,
  generatePath,
  useSearchParams,
} from "react-router-dom";
import { AddRouteToCollection } from "./AddRouteToCollection";

type Crumb = {
  label: ReactNode;
  href?: string;
};

function useCrumbs(): Crumb[] {
  const crumbs: Crumb[] = [{ label: "Home", href: "/" }];
  const collectionIdText = useActiveCollectionId();
  const traceId = useActiveTraceId();
  const entryId = useActiveCollectionEntryId();

  const [searchParams] = useSearchParams();
  const flattenedParams = searchParams.toString();

  const { data: collections } = useCollections();
  const collectionId = Number.parseInt(collectionIdText ?? "");

  if (!Number.isNaN(collectionId)) {
    const collectionLink = `${generatePath(COLLECTION_ROUTE, {
      collectionId: collectionId.toString(),
    })}${flattenedParams ? `?${flattenedParams}` : ""}`;
    const collection = collections?.find((c) => c.id === collectionId);
    if (collection) {
      crumbs.push({
        label: (
          <span className="flex gap-2 items-center">
            <Icon icon="lucide:folder" />
            {collection.name}
          </span>
        ),
        href: collectionLink,
      });
    } else {
      crumbs.push({ label: "Collection", href: collectionLink });
    }
  }

  if (traceId) {
    crumbs.push({ label: "Route" });
  } else if (entryId && collectionId) {
    const collection = collections?.find((item) => item.id === collectionId);
    const collectionItem = collection?.collectionItems.find(
      (item) => item.id.toString() === entryId,
    );
    const label = collectionItem?.name || "Route";
    crumbs.push({ label });
  }
  return crumbs;
}

export function MainTopSection() {
  const crumbs = useCrumbs();
  return (
    <div className="grid grid-cols-[1fr_auto] h-14 px-4 items-center">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          if (crumb.href) {
            return (
              <Fragment key={index}>
                {index > 0 && (
                  <BreadcrumbSeparator className="flex items-center" />
                )}
                <BreadcrumbLink key={index} asChild>
                  <li className="flex items-center">
                    <Link to={crumb.href} className="flex items-center">
                      {crumb.label}
                    </Link>
                  </li>
                </BreadcrumbLink>
              </Fragment>
            );
          }
          return (
            <Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator className="flex items-center" />
              )}
              <BreadcrumbItem key={index}>{crumb.label}</BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
      <Routes>
        <Route path={COLLECTION_ROUTE} element={null} />
        <Route path="*" element={<AddRouteToCollection />} />
      </Routes>
    </div>
  );
}
