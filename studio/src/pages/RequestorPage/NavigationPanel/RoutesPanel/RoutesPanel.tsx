import { Input } from "@/components/ui/input";
import { useInputFocusDetection } from "@/hooks";
import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
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

  const { isInputFocused, blurActiveInput } = useInputFocusDetection();

  const handleRouteClick = useHandler((route: ProbedRoute) => {
    navigate(
      {
        pathname: "/",
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

  const activeRouteIndex = useMemo(() => {
    return (
      filteredRoutes?.findIndex(
        (r) => r.path === activeRoute?.path && r.method === activeRoute.method,
      ) ?? -1
    );
  }, [filteredRoutes, activeRoute]);

  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null,
  );

  const getNextRouteIndex = (currentIndex: number, direction: 1 | -1) => {
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) {
      nextIndex = filteredRoutes.length - 1;
    } else if (nextIndex >= filteredRoutes.length) {
      nextIndex = 0;
    }
    return nextIndex;
  };

  const searchRef = useRef<HTMLInputElement>(null);

  useHotkeys(["j", "k", "ArrowDown", "ArrowUp", "/"], (event) => {
    event.preventDefault();
    switch (event.key) {
      case "j":
      case "ArrowDown":
        setSelectedRouteIndex((prevIndex) =>
          getNextRouteIndex(prevIndex ?? activeRouteIndex, 1),
        );
        break;
      case "k":
      case "ArrowUp":
        setSelectedRouteIndex((prevIndex) =>
          getNextRouteIndex(prevIndex ?? activeRouteIndex, -1),
        );
        break;

      case "/": {
        if (searchRef.current) {
          searchRef.current.focus();
          setSelectedRouteIndex(null);
        }
        break;
      }
    }
  });

  useHotkeys(
    ["Escape", "Enter"],
    (event) => {
      switch (event.key) {
        case "Enter": {
          if (isInputFocused && filteredRoutes.length > 0) {
            setSelectedRouteIndex(0);
            const firstRouteElement = document.getElementById(
              `route-${selectedRouteIndex}`,
            );
            if (firstRouteElement) {
              firstRouteElement.focus();
            }
            break;
          }

          if (
            selectedRouteIndex !== null &&
            filteredRoutes[selectedRouteIndex]
          ) {
            handleRouteClick(filteredRoutes[selectedRouteIndex]);
          }
          break;
        }

        case "Escape": {
          if (isInputFocused) {
            blurActiveInput();
            break;
          }

          if (filterValue) {
            setFilterValue("");
            break;
          }

          setSelectedRouteIndex(null);
          break;
        }
      }
    },
    { enableOnFormTags: ["input"] },
  );

  return (
    <div className={cn("h-full", "flex", "flex-col")}>
      <div>
        <div className="flex items-center space-x-2 pb-3">
          <Input
            ref={searchRef}
            className="text-sm"
            placeholder="Search (hit / to focus)"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            onFocus={() => setSelectedRouteIndex(null)}
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
                selectedRoute={selectedRouteIndex === index ? route : null}
                handleRouteClick={handleRouteClick}
                setSelectedRouteIndex={setSelectedRouteIndex}
              />
            ))}
          </RoutesSection>
        )}

        <RoutesSection title="Detected in app">
          {detectedRoutes?.map((route, index) => (
            <RoutesItem
              key={index}
              index={userAddedRoutes.length + index}
              route={route}
              selectedRoute={
                selectedRouteIndex === userAddedRoutes.length + index
                  ? route
                  : null
              }
              activeRoute={activeRoute}
              handleRouteClick={handleRouteClick}
              setSelectedRouteIndex={setSelectedRouteIndex}
            />
          ))}
        </RoutesSection>

        {hasAnyOpenApiRoutes && (
          <RoutesSection title="OpenAPI">
            {openApiRoutes?.map((route, index) => (
              <RoutesItem
                key={index}
                index={userAddedRoutes.length + detectedRoutes.length + index}
                route={route}
                selectedRoute={
                  selectedRouteIndex ===
                  userAddedRoutes.length + detectedRoutes.length + index
                    ? route
                    : null
                }
                activeRoute={activeRoute}
                handleRouteClick={handleRouteClick}
                setSelectedRouteIndex={setSelectedRouteIndex}
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
    <section className="p-2 w-full">
      <h4 className="font-medium font-mono uppercase text-xs text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-0.5 overflow-y-auto mt-4 w-full overflow-x-hidden">
        {children}
      </div>
    </section>
  );
}
