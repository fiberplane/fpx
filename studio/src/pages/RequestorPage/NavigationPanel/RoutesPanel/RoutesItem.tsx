import { cn, getHttpMethodTextColor } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { useDeleteRoute } from "../../queries";
import { type ProbedRoute, isWsRequest } from "../../types";

type RoutesItemProps = {
  index: number;
  route: ProbedRoute;
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
};

export function RoutesItem(props: RoutesItemProps) {
  const { index, route, selectedRoute, handleRouteClick } = props;
  const { mutate: deleteRoute } = useDeleteRoute();
  const canDeleteRoute =
    route.routeOrigin === "custom" ||
    !route.currentlyRegistered ||
    route.routeOrigin === "open_api";

  const method = isWsRequest(route.requestType) ? "WS" : route.method;
  return (
    <div
      key={index}
      onClick={() => handleRouteClick(route)}
      onKeyUp={(e) => {
        if (e.key === "Enter") {
          handleRouteClick(route);
        }
      }}
      data-state-active={selectedRoute === route}
      className={cn(
        "flex items-center py-1 pl-5 pr-2 rounded cursor-pointer font-mono text-sm",
        {
          "bg-muted": selectedRoute === route,
          "hover:bg-muted": selectedRoute !== route,
        },
      )}
    >
      <span
        className={cn("text-xs", "min-w-12", getHttpMethodTextColor(method))}
      >
        {method}
      </span>
      <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
        {route.path}
      </span>
      {
        // TODO - Add a delete button here
        canDeleteRoute && (
          <div className="ml-auto flex items-center group">
            <TrashIcon
              className="w-3.5 h-3.5 cursor-pointer pointer-events-none group-hover:pointer-events-auto invisible group-hover:visible"
              onClick={(e) => {
                e.stopPropagation();
                deleteRoute({ path: route.path, method: route.method });
              }}
            />
          </div>
        )
      }
    </div>
  );
}
