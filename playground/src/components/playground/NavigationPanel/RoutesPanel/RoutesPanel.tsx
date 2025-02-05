import { cn } from "@/utils";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStudioStore } from "../../store";
import type { ApiRoute } from "../../types";
import { Search } from "../Search";
import { RoutesItem } from "./RoutesItem";
import { RoutesSection } from "./RoutesSection";

const UNTAGGED_TAG = "untagged";

function useRoutesGroupedByTags(routes: ApiRoute[]) {
  const routesGroupedByTags = useMemo(() => {
    return routes.reduce<Record<string, ApiRoute[]>>((acc, route) => {
      // NOTE - Also group routes without tags under the "untagged" tag
      const tags = route.tags?.length ? route.tags : [UNTAGGED_TAG];

      // Add route to each of its tags
      for (const tag of tags) {
        if (!acc[tag]) {
          acc[tag] = [];
        }
        acc[tag].push(route);
      }

      return acc;
    }, {});
  }, [routes]);

  // Get sorted tag names (TODO: respect tag order from spec instead of doing alphabetical ordering)
  const sortedTags = useMemo(() => {
    const tags = Object.keys(routesGroupedByTags);
    // If all routes are untagged, return empty array to signal no tags
    if (tags.length === 1 && tags[0] === UNTAGGED_TAG) {
      return [];
    }

    return tags.sort((a, b) => {
      // Always put untagged at the end
      if (a === UNTAGGED_TAG) {
        return 1;
      }

      if (b === UNTAGGED_TAG) {
        return -1;
      }

      return a.localeCompare(b);
    });
  }, [routesGroupedByTags]);

  return { routesGroupedByTags, sortedTags };
}

export function RoutesPanel() {
  const { appRoutes: routes, activeRoute } = useStudioStore(
    "appRoutes",
    "activeRoute",
  );

  const [filterValue, setFilterValue] = useState("");
  const filteredRoutes = useMemo(() => {
    const cleanFilter = filterValue.trim().toLowerCase();
    if (cleanFilter.length < 3) {
      return routes;
    }

    return routes.filter((r) => {
      const matchesPath = r.path.toLowerCase().includes(cleanFilter);
      const matchesSummary = r.summary?.toLowerCase().includes(cleanFilter);
      const matchesTags = r.tags?.some((tag) =>
        tag.toLowerCase().includes(cleanFilter),
      );
      return matchesPath || matchesSummary || matchesTags;
    });
  }, [filterValue, routes]);

  // TODO - Remove the notion of "detected" routes, since this is a holdover from Studio
  const detectedRoutes = useMemo(() => {
    const detected = [...filteredRoutes];
    return detected;
  }, [filteredRoutes]);

  const { routesGroupedByTags, sortedTags } =
    useRoutesGroupedByTags(detectedRoutes);

  const hasAnyRoutes = routes.length > 0;
  const allRoutes = useMemo(() => {
    // If no tags, just return all routes
    if (sortedTags.length === 0) {
      return routesGroupedByTags[UNTAGGED_TAG] || [];
    }

    // Otherwise flatten routes in tag order for keyboard navigation
    return sortedTags.flatMap((tag) => routesGroupedByTags[tag]);
  }, [routesGroupedByTags, sortedTags]);

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
        {hasAnyRoutes &&
          (detectedRoutes.length === 0 ? (
            <div className="italic text-center text-muted-foreground text-xs my-4">
              No routes match filter criteria
            </div>
          ) : sortedTags.length === 0 ? (
            // If no tags, render routes directly without sections
            <div className="grid">
              {allRoutes.map((route) => (
                <RoutesItem
                  key={`${route.method}-${route.path}`}
                  index={allRoutes.findIndex(
                    (r) => r.path === route.path && r.method === route.method,
                  )}
                  route={route}
                  selectedRoute={
                    selectedRouteIndex ===
                    allRoutes.findIndex(
                      (r) => r.path === route.path && r.method === route.method,
                    )
                      ? route
                      : null
                  }
                  activeRoute={activeRoute}
                  setSelectedRouteIndex={setSelectedRouteIndex}
                />
              ))}
            </div>
          ) : (
            // Otherwise render routes grouped by tags
            sortedTags.map((tag) => (
              <RoutesSection key={tag} title={tag}>
                <div className="grid">
                  {routesGroupedByTags[tag].map((route) => {
                    // Calculate the global index for this route
                    const globalIndex = allRoutes.findIndex(
                      (r) => r.path === route.path && r.method === route.method,
                    );

                    return (
                      <RoutesItem
                        key={`${route.method}-${route.path}`}
                        index={globalIndex}
                        route={route}
                        selectedRoute={
                          selectedRouteIndex === globalIndex ? route : null
                        }
                        activeRoute={activeRoute}
                        setSelectedRouteIndex={setSelectedRouteIndex}
                      />
                    );
                  })}
                </div>
              </RoutesSection>
            ))
          ))}
      </div>
    </div>
  );
}
