import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { CrumbLabelContent } from "./CrumbLabelContent";
import type { Crumb } from "./useCrumbs";

export function CrumbContent(props: Crumb & { last: boolean }) {
  const { to, label, last, onActivate } = props;
  if (to) {
    return (
      <BreadcrumbLink asChild>
        <li className="flex items-center">
          <Link to={to} className="flex items-center" onClick={onActivate}>
            <CrumbLabelContent label={label} last={last} />
          </Link>
        </li>
      </BreadcrumbLink>
    );
  }

  return (
    <BreadcrumbItem>
      <CrumbLabelContent label={label} last={last} />
    </BreadcrumbItem>
  );
}
