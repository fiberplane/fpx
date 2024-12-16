import {
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";
import { CrumbContent } from "./CrumbContent";
import { useCrumbs } from "./useCrumbs";

export function MainTopSection() {
  const crumbs = useCrumbs();
  return (
    <div className="grid grid-cols-[1fr_auto] mt-2 px-4 items-center">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          return (
            <Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator className="flex items-center mt-[3px]" />
              )}
              <CrumbContent {...crumb} last={index === crumbs.length - 1} />
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </div>
  );
}
