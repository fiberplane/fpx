import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getHttpMethodString, getHttpMethodTextColor } from "@/utils";
import { Link } from "@tanstack/react-router";
import { memo, useEffect, useRef } from "react";
import type { ApiRoute } from "../../types";

type RoutesItemProps = {
  index: number;
  route: ApiRoute;
  activeRoute: ApiRoute | null;
  selectedRoute: ApiRoute | null;
  setSelectedRouteIndex: (index: number | null) => void;
};

export const RoutesItem = memo(function RoutesItem(props: RoutesItemProps) {
  const { index, route, activeRoute, selectedRoute, setSelectedRouteIndex } =
    props;

  const method = route.method;
  const isSelected =
    selectedRoute === route ||
    (route.path === selectedRoute?.path &&
      route.method === selectedRoute.method);
  const isActive =
    activeRoute === route ||
    (route.path === activeRoute?.path && route.method === activeRoute.method);
  const buttonRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (isSelected && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isSelected]);

  const displayText = route.summary || route.path;
  const tooltipText = route.summary
    ? `${route.summary}\n${route.path}`
    : route.path;

  return (
    <Link
      ref={buttonRef}
      to="."
      search={{ method, uri: route.path }}
      type="button"
      onFocus={() => setSelectedRouteIndex(index)}
      onBlur={() => setSelectedRouteIndex(null)}
      onMouseEnter={() => setSelectedRouteIndex(null)}
      data-state-active={isActive}
      data-state-selected={isSelected}
      tabIndex={0}
      className={cn(
        "grid",
        "grid-cols-[auto_1fr]",
        "w-full items-center px-2 py-1 rounded cursor-pointer font-mono text-sm text-left gap-2",
        "focus:outline-none min-w-0",
        {
          "bg-muted": isActive,
          "hover:bg-muted": !isActive,
          "focus:ring-inset focus:ring-1 focus:ring-blue-500 focus:ring-opacity-25 bg-muted":
            isSelected,
        },
      )}
      id={`route-${index}`}
    >
      <span
        className={cn("text-xs", "min-w-12", getHttpMethodTextColor(method))}
      >
        {getHttpMethodString(method)}
      </span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap block">
              {displayText}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="whitespace-pre-line">{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </Link>
  );
});
