import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { COLLECTION_ROUTE } from "@/constants";
import { noop } from "@/utils";
import { Icon } from "@iconify/react";
import { Fragment } from "react";
import { Link, Route, Routes } from "react-router-dom";
import { AddRouteToCollection } from "../AddRouteToCollection";
import { type Crumb, useCrumbs } from "./useCrumbs";

export function MainTopSection() {
  const crumbs = useCrumbs();
  return (
    <div className="grid grid-cols-[1fr_auto] h-16 mt-1 mb-[14px] px-4 items-center">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          return (
            <Fragment key={index}>
              {index > 0 && (
                <BreadcrumbSeparator className="flex items-center" />
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

const CrumbContent = (props: Crumb) => {
  if (props.href) {
    return (
      <BreadcrumbLink asChild>
        <li className="flex items-center">
          <Link
            to={props.href}
            className="flex items-center"
            onClick={props.onActivate || noop}
          >
            <LabelContent label={props.label} />
          </Link>
        </li>
      </BreadcrumbLink>
    );
  }

  return (
    <BreadcrumbItem>
      <LabelContent label={props.label} />
    </BreadcrumbItem>
  );
};

function LabelContent({ label }: { label: Crumb["label"] }) {
  return typeof label === "object" ? (
    <span className="flex gap-2 items-center">
      <Icon icon={label.icon} />
      {label.text}
    </span>
  ) : (
    label
  );
}
