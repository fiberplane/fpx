import { cn, getHttpMethodTextColor } from "@/utils";
import { TrashIcon } from "@radix-ui/react-icons";
import { useDeleteRoute } from "../../queries";
import { type ProbedRoute, isWsRequest } from "../../types";

export function RouteItem({
  route,
  deleteDraftRoute,
}: {
  route: ProbedRoute;
  deleteDraftRoute?: () => void;
}) {
  const { mutate: deleteRoute } = useDeleteRoute();
  const canDeleteRoute =
    route.routeOrigin === "custom" ||
    !route.currentlyRegistered ||
    route.routeOrigin === "open_api";

  const method = isWsRequest(route.requestType) ? "WS" : route.method;
  return (
    <>
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
                if (route.isDraft) {
                  deleteDraftRoute?.();
                } else {
                  deleteRoute({ path: route.path, method: route.method });
                }
              }}
            />
          </div>
        )
      }
    </>
  );
}
