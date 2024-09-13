import { cn, getHttpMethodTextColor } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { useEffect, useRef } from "react";
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

export function RoutesItem(props: RoutesItemProps) {
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
  const isSelected = selectedRoute === route;
  const isActive = activeRoute === route;
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
      data-state-active={isActive}
      data-state-selected={isSelected}
      tabIndex={0}
      className={cn(
        "flex items-center ml-1 mr-2 py-1 rounded cursor-pointer font-mono text-sm w-full",
        "focus:outline-none",
        {
          "bg-muted": isActive,
          "hover:bg-muted": !isActive,
          "focus:ring-inset focus:ring-1 focus:ring-blue-500 bg-muted":
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
      <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
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
}
