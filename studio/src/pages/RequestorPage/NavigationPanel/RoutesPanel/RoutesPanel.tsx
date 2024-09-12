import { Input } from "@/components/ui/input";
import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AddRouteButton } from "../../routes";
import { useRequestorStore } from "../../store";
import type { ProbedRoute } from "../../types";
import { RoutesItem } from "./RoutesItem";

export function RoutesPanel() {
  const { routes, activeRoute, setActiveRoute } = useRequestorStore(
    "routes",
    "activeRoute",
    "setActiveRoute",
  );

  const navigate = useNavigate();

  const handleRouteClick = useHandler((route: ProbedRoute) => {
    navigate(
      {
        pathname: "/requestor/",
      },
      { replace: true },
    );
    setActiveRoute(route);
  });

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

  return (
    <div className={cn("h-full", "flex", "flex-col")}>
      <div>
        <div className="flex items-center space-x-2 pb-3">
          <Input
            className="text-sm"
            placeholder="Search"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
          <AddRouteButton />
        </div>
      </div>
      {/* TODO: resolve when routes overflow */}
      <div className="overflow-y-auto h-full relative">
        {hasAnyUserAddedRoutes && (
          <RoutesSection title="Custom routes">
            {userAddedRoutes?.map((route, index) => (
              <RoutesItem
                key={index}
                index={index}
                route={route}
                activeRoute={activeRoute}
                handleRouteClick={handleRouteClick}
              />
            ))}
          </RoutesSection>
        )}

        <RoutesSection title="Detected in app">
          {detectedRoutes?.map((route, index) => (
            <RoutesItem
              key={index}
              index={index}
              route={route}
              activeRoute={activeRoute}
              handleRouteClick={handleRouteClick}
            />
          ))}
        </RoutesSection>

        {hasAnyOpenApiRoutes && (
          <RoutesSection title="OpenAPI">
            {openApiRoutes?.map((route, index) => (
              <RoutesItem
                key={index}
                index={index}
                route={route}
                activeRoute={activeRoute}
                handleRouteClick={handleRouteClick}
              />
            ))}
          </RoutesSection>
        )}
      </div>
    </div>
  );
}

type RoutesSectionProps = {
  title: string;
  children: React.ReactNode;
};

export function RoutesSection(props: RoutesSectionProps) {
  const { title, children } = props;

  return (
    <section className="mt-4">
      <div>
        <h4 className="font-medium font-mono uppercase text-xs text-muted-foreground">
          {title}
        </h4>
      </div>
      <div className="space-y-0.5 overflow-y-auto mt-4">{children}</div>
    </section>
  );
}
