import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStudioStore } from "../../store";
import type { ProbedRoute } from "../../types";
import { Search } from "../Search";
import { RoutesItem } from "./RoutesItem";
import { RoutesSection } from "./RoutesSection";

export function RoutesPanel() {
  const {
    appRoutes: routes,
    activeRoute,
    setActiveRoute,
  } = useStudioStore("appRoutes", "activeRoute", "setActiveRoute");

  const handleRouteClick = useHandler((route: ProbedRoute) => {
    setActiveRoute(route);
  });

  const [filterValue, setFilterValue] = useState("");
  const filteredRoutes = useMemo(() => {
    const cleanFilter = filterValue.trim().toLowerCase();
    if (cleanFilter.length < 3) {
      return routes;
    }

    return routes.filter((r) => r.path.toLowerCase().includes(cleanFilter));
  }, [filterValue, routes]);

  const detectedRoutes = useMemo(() => {
    const detected = filteredRoutes.filter(
      (r) => r.routeOrigin === "discovered" && r.currentlyRegistered,
    );
    // NOTE - This preserves the order the routes were registered in the Hono api
    detected.sort((a, b) => a.registrationOrder - b.registrationOrder);
    return detected;
  }, [filteredRoutes]);

  const hasAnyRoutes = routes.length > 0;
  const visibleRoutes = detectedRoutes;
  const allRoutes = useMemo(() => {
    return [...visibleRoutes];
  }, [visibleRoutes]);

  const activeRouteIndex = useMemo(() => {
    return allRoutes.findIndex(
      (r) => r.path === activeRoute?.path && r.method === activeRoute.method,
    );
  }, [allRoutes, activeRoute]);

  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(
    null,
  );

  const getNextRouteIndex = (currentIndex: number, direction: 1 | -1) => {
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) {
      nextIndex = allRoutes.length - 1;
    } else if (nextIndex >= allRoutes.length) {
      nextIndex = 0;
    }
    return nextIndex;
  };

  const searchRef = useRef<HTMLInputElement>(null);

  useHotkeys(["j", "k", "/"], (event) => {
    event.preventDefault();
    switch (event.key) {
      case "j":
        setSelectedRouteIndex((prevIndex) =>
          getNextRouteIndex(prevIndex ?? activeRouteIndex, 1),
        );
        break;
      case "k":
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

  const navigate = useNavigate();

  const handleItemSelect = (index: number) => {
    const route = allRoutes[index];
    if (!route) {
      return;
    }

    navigate({
      to: ".",
      search: {
        method: allRoutes[index].method,
        uri: allRoutes[index].path,
      },
    });
  };

  return (
    <div className={cn("h-full", "flex", "flex-col")}>
      <div>
        <div className="flex items-center space-x-2 pb-3">
          <Search
            ref={searchRef}
            value={filterValue}
            onChange={setFilterValue}
            onFocus={() => {
              setSelectedRouteIndex(null);
            }}
            placeholder="routes"
            onItemSelect={handleItemSelect}
            itemCount={allRoutes.length}
          />
        </div>
      </div>
      <div className="overflow-y-auto h-full relative flex flex-col gap-2">
        {hasAnyRoutes && (
          <RoutesSection title="Routes">
            {detectedRoutes.length === 0 ? (
              <div className="italic text-center text-muted-foreground text-xs my-4">
                No routes match filter criteria
              </div>
            ) : (
              <div className="grid">
                {detectedRoutes.map((route, index) => (
                  <RoutesItem
                    key={index}
                    index={index}
                    route={route}
                    selectedRoute={selectedRouteIndex === index ? route : null}
                    activeRoute={activeRoute}
                    handleRouteClick={handleRouteClick}
                    setSelectedRouteIndex={setSelectedRouteIndex}
                  />
                ))}
              </div>
            )}
          </RoutesSection>
        )}
      </div>
    </div>
  );
}
