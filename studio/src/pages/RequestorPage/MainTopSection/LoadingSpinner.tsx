import { useStickyLoading } from "@/hooks";
import { cn } from "@/utils";
import { Icon } from "@iconify/react";

export function LoadingSpinner({ loading }: { loading: boolean }) {
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
