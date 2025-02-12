import { Icon } from "@iconify/react";
import type { Crumb } from "./useCrumbs";

export function CrumbLabelContent({
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
