import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { COLLECTION_ROUTE } from "@/constants";
import { Fragment } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { AddRouteToCollection } from "../AddRouteToCollection";
import { useCrumbs } from "./useCrumbs";
import { noop } from "@/utils";

export function MainTopSection() {
  const crumbs = useCrumbs();
  return (
    <div className="grid grid-cols-[1fr_auto] h-16 mt-1 mb-[14px] px-4 items-center">
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
                    <Link to={crumb.href} className="flex items-center" onClick={crumb.onActivate || noop}>
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
