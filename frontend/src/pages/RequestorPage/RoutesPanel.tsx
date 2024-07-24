import { Input } from "@/components/ui/input";
import { useCustomRoutesEnabled } from "@/hooks";
import { cn } from "@/utils";
import {
  CaretDownIcon,
  CaretRightIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { Resizable } from "react-resizable";
import { ResizableHandle } from "./Resizable";
import { useResizableWidth, useStyleWidth } from "./hooks";
import { getHttpMethodTextColor } from "./method";
import { ProbedRoute, useDeleteRoute } from "./queries";
import { AddRouteButton } from "./routes";
import { BACKGROUND_LAYER } from "./styles";

type RoutesPanelProps = {
  routes?: ProbedRoute[];
  draftRoutes?: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
};

export function RoutesPanel({
  routes,
  // NOTE - Draft routes not yet implemented, waiting for future PR
  draftRoutes,
  selectedRoute,
  handleRouteClick,
}: RoutesPanelProps) {
  const customRoutesEnabled = useCustomRoutesEnabled();
  const { width, handleResize } = useResizableWidth(320);
  const styleWidth = useStyleWidth(width);

  const hasAnyPreviouslyDetectedRoutes = useMemo(() => {
    return routes?.some((r) => !r.currentlyRegistered) ?? false;
  }, [routes]);

  const hasAnyDraftRoutes = useMemo(() => {
    return routes?.some((r) => r.isDraft) ?? false;
  }, [routes]);

  const hasAnyUserAddedRoutes = useMemo(() => {
    return routes?.some((r) => r.routeOrigin === "custom") ?? false;
  }, [routes]);

  const hasAnyOpenApiRoutes = useMemo(() => {
    return routes?.some((r) => r.routeOrigin === "open_api") ?? false;
  }, [routes]);

  const [filterValue, setFilterValue] = useState("");
  const filteredRoutes = useMemo(() => {
    const cleanFilter = filterValue.trim().toLowerCase();
    if (cleanFilter.length < 3 && routes) {
      return routes;
    }
    return routes?.filter((r) => r.path.includes(filterValue));
  }, [filterValue, routes]);

  const prevDetectedRoutes = useMemo(() => {
    return (
      filteredRoutes?.filter(
        (r) => r.routeOrigin === "discovered" && !r.currentlyRegistered,
      ) ?? []
    );
  }, [filteredRoutes]);

  const detectedRoutes = useMemo(() => {
    return (
      filteredRoutes?.filter(
        (r) => r.routeOrigin === "discovered" && r.currentlyRegistered,
      ) ?? []
    );
  }, [filteredRoutes]);

  const openApiRoutes = useMemo(() => {
    return filteredRoutes?.filter((r) => r.routeOrigin === "open_api") ?? [];
  }, [filteredRoutes]);

  const userAddedRoutes = useMemo(() => {
    return filteredRoutes?.filter((r) => r.routeOrigin === "custom") ?? [];
  }, [filteredRoutes]);

  return (
    <Resizable
      className={`w-full hidden lg:block lg:min-w-[200px] lg:w-[${width}px] lg:mt-0`}
      width={width} // Initial width
      axis="x" // Restrict resizing to the horizontal axis
      onResize={handleResize}
      resizeHandles={["e"]} // Limit resize handle to just the east (right) handle
      handle={(_, ref) => (
        // Render a custom handle component, so we can indicate "resizability"
        // along the entire right side of the container
        <ResizableHandle ref={ref} />
      )}
    >
      <div
        style={styleWidth}
        className={cn(
          BACKGROUND_LAYER,
          "px-4 overflow-hidden overflow-y-auto border rounded-md",
          "lg:h-full",
        )}
      >
        <div
          className={cn(
            "sticky top-0 z-10",
            // HACK - This needs to have an explicity bg color so that when we scroll behind it,
            //        the content doesn't show line-through
            // TODO - Improve the grid layout to remove the need to have this be sticky and have a bg color
            "bg-[rgb(24,30,43)]",
          )}
        >
          <h2 className="flex items-center justify-between rounded cursor-pointer text-base h-12">
            Routes
          </h2>
          <div className="flex items-center space-x-2 pb-3">
            <Input
              className="text-sm"
              placeholder="Search routes"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
            {customRoutesEnabled && <AddRouteButton />}
          </div>
        </div>
        <div className="overflow-y-auto relative">
          {hasAnyDraftRoutes && (
            <RoutesSection
              title="Draft routes"
              routes={draftRoutes ?? []}
              selectedRoute={selectedRoute}
              handleRouteClick={handleRouteClick}
            />
          )}

          {hasAnyUserAddedRoutes && (
            <RoutesSection
              title="Custom routes"
              routes={userAddedRoutes ?? []}
              selectedRoute={selectedRoute}
              handleRouteClick={handleRouteClick}
            />
          )}

          <RoutesSection
            title="Detected in app"
            routes={detectedRoutes}
            selectedRoute={selectedRoute}
            handleRouteClick={handleRouteClick}
          />

          {hasAnyPreviouslyDetectedRoutes && (
            <RoutesSection
              title="Previously detected routes"
              routes={prevDetectedRoutes}
              selectedRoute={selectedRoute}
              handleRouteClick={handleRouteClick}
            />
          )}

          {hasAnyOpenApiRoutes && (
            <RoutesSection
              title="OpenAPI"
              routes={openApiRoutes ?? []}
              selectedRoute={selectedRoute}
              handleRouteClick={handleRouteClick}
            />
          )}
        </div>
      </div>
    </Resizable>
  );
}

type RoutesSectionProps = {
  title: string;
  routes: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
};

function RoutesSection(props: RoutesSectionProps) {
  const { title, routes, selectedRoute, handleRouteClick } = props;

  const [showRoutesSection, setShowRoutesSection] = useState(true);
  const ShowRoutesSectionIcon = showRoutesSection
    ? CaretDownIcon
    : CaretRightIcon;

  return (
    <>
      <div className="font-medium text-sm flex items-center mb-2 mt-4">
        <ShowRoutesSectionIcon
          className="h-4 w-4 mr-0.5 cursor-pointer"
          onClick={() => {
            setShowRoutesSection((current) => !current);
          }}
        />
        {title}
      </div>
      {showRoutesSection && (
        <div className="space-y-0.5 overflow-y-auto">
          {routes?.map?.((route, index) => (
            <div
              key={index}
              onClick={() => handleRouteClick(route)}
              className={cn(
                "flex items-center py-1 pl-5 pr-2 rounded cursor-pointer font-mono text-sm",
                {
                  "bg-muted": selectedRoute === route,
                  "hover:bg-muted": selectedRoute !== route,
                },
              )}
            >
              <RouteItem route={route} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export function RouteItem({ route }: { route: ProbedRoute }) {
  const { mutate: deleteRoute } = useDeleteRoute();
  const canDeleteRoute =
    route.routeOrigin === "custom" || !route.currentlyRegistered;
  return (
    <>
      <span
        className={cn(
          "text-xs",
          "min-w-12",
          getHttpMethodTextColor(route.method),
        )}
      >
        {route.method}
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
    </>
  );
}
