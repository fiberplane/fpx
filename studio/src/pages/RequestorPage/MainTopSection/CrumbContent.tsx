import { BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import type { Crumb } from "./useCrumbs";

export function CrumbContent(props: Crumb) {
  if (props.href) {
    return (
      <BreadcrumbLink asChild>
        <li className="flex items-center">
          <Link
            to={props.href}
            className="flex items-center"
            onClick={props.onActivate}
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
}

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
