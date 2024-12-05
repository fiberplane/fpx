import { cn, getHttpMethodTextColor } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { memo, useEffect, useRef } from "react";
import { useDeleteRoute } from "../../queries";
import { type ProbedRoute, isWsRequest } from "../../types";

type RoutesItemProps = {
  index: number;
  route: ProbedRoute;
  activeRoute: ProbedRoute | null;
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
  setSelectedRouteIndex: (index: number | null) => void;
};

export const RoutesItem = memo(function RoutesItem(props: RoutesItemProps) {
  const {
    index,
    route,
    activeRoute,
    selectedRoute,
    handleRouteClick,
    setSelectedRouteIndex,
  } = props;
  const { mutate: deleteRoute } = useDeleteRoute();
  const canDeleteRoute =
    route.routeOrigin === "custom" ||
    !route.currentlyRegistered ||
    route.routeOrigin === "open_api";

  const method = isWsRequest(route.requestType) ? "WS" : route.method;
  const isSelected =
    selectedRoute === route ||
    (route.path === selectedRoute?.path &&
      route.method === selectedRoute.method);
  const isActive =
    activeRoute === route ||
    (route.path === activeRoute?.path && route.method === activeRoute.method);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isSelected]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={() => handleRouteClick(route)}
      onFocus={() => setSelectedRouteIndex(index)}
      onBlur={() => setSelectedRouteIndex(null)}
      onMouseEnter={() => setSelectedRouteIndex(null)}
      data-state-active={isActive}
      data-state-selected={isSelected}
      tabIndex={0}
      className={cn(
        "grid",
        {
          "grid-cols-[auto_1fr]": !canDeleteRoute,
          "grid-cols-[auto_1fr_auto]": canDeleteRoute,
        },
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
        {method}
      </span>
      <span className="overflow-hidden text-ellipsis whitespace-nowrap block">
        {route.path}
      </span>
      {canDeleteRoute && (
        <div className="ml-auto flex items-center group">
          <TrashIcon
            className="w-3.5 h-3.5 cursor-pointer pointer-events-none group-hover:pointer-events-auto invisible group-hover:visible"
            onClick={(e) => {
              e.stopPropagation();
              deleteRoute({ path: route.path, method: route.method });
            }}
          />
        </div>
      )}
    </button>
  );
});
