import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useRequestorStore } from "../../reducer";
import { AddRouteButton } from "../../routes";
import { RoutesSection } from "./RoutesSection";

type RoutesPanelProps = {
  deleteDraftRoute?: () => void;
};

export function RoutesPanel({ deleteDraftRoute }: RoutesPanelProps) {
  const {
    routes,
    selectedRoute,
    selectRoute: handleRouteClick,
  } = useRequestorStore(
    useShallow(({ routes, selectedRoute, selectRoute }) => ({
      routes,
      selectedRoute,
      selectRoute,
    })),
  );

  const hasAnyPreviouslyDetectedRoutes = useMemo(() => {
    return routes?.some((r) => !r.currentlyRegistered) ?? false;
  }, [routes]);

  const hasAnyDraftRoutes = useMemo(() => {
    return routes?.some((r) => r.isDraft) ?? false;
  }, [routes]);

  const hasAnyUserAddedRoutes = useMemo(() => {
    return (
      routes?.some((r) => r.routeOrigin === "custom" && !r.isDraft) ?? false
    );
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
    const detected =
      filteredRoutes?.filter(
        (r) => r.routeOrigin === "discovered" && r.currentlyRegistered,
      ) ?? [];
    // NOTE - This preserves the order the routes were registered in the Hono api
    detected.sort((a, b) => a.registrationOrder - b.registrationOrder);
    return detected;
  }, [filteredRoutes]);

  const openApiRoutes = useMemo(() => {
    return filteredRoutes?.filter((r) => r.routeOrigin === "open_api") ?? [];
  }, [filteredRoutes]);

  const userAddedRoutes = useMemo(() => {
    return (
      filteredRoutes?.filter((r) => r.routeOrigin === "custom" && !r.isDraft) ??
      []
    );
  }, [filteredRoutes]);

  const draftRoutes = useMemo(() => {
    return filteredRoutes?.filter((r) => r.isDraft) ?? [];
  }, [filteredRoutes]);

  return (
    <div className={cn("h-full", "flex", "flex-col")}>
      <div>
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
          <AddRouteButton />
        </div>
      </div>
      <div className="overflow-y-auto relative">
        {hasAnyDraftRoutes && (
          <RoutesSection
            title="Draft routes"
            routes={draftRoutes ?? []}
            selectedRoute={selectedRoute}
            handleRouteClick={handleRouteClick}
            deleteDraftRoute={deleteDraftRoute}
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
  );
}
