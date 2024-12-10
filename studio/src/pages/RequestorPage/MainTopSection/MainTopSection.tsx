import {
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { COLLECTION_ROUTE } from "@/constants";
import { Fragment } from "react";
import { Route, Routes } from "react-router-dom";
import { AddRouteToCollection } from "../AddRouteToCollection";
import { CrumbContent } from "./CrumbContent";
import { useCrumbs } from "./useCrumbs";

export function MainTopSection() {
  const crumbs = useCrumbs();
  return (
    <div className="grid grid-cols-[1fr_auto] mt-1 mt-2 px-4 items-center">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          return (
            <Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator className="flex items-center mt-[3px]" />
              )}
              <CrumbContent {...crumb} />
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
