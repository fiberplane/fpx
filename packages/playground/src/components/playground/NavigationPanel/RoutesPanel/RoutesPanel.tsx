import { cn } from "@/utils";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStudioStore } from "../../store";
import type { ApiRoute } from "../../types";
import { Search } from "../Search";
import { RoutesItem } from "./RoutesItem";
import { RoutesSection } from "./RoutesSection";

const UNTAGGED = Symbol("untagged");

function useRoutesGroupedByTags(routes: ApiRoute[], tagOrder: string[]) {
  const routesGroupedByTags = useMemo(() => {
    return routes.reduce<Record<string | symbol, ApiRoute[]>>((acc, route) => {
      // NOTE - Also group routes without tags under the "untagged" tag
      const tags = route.tags?.length ? route.tags : [UNTAGGED];

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

  // Get sorted tag names
  const sortedTags = useMemo(() => {
    const tags = Object.keys(routesGroupedByTags);

    // If all routes are untagged, return empty array to signal no tags
    // This allows us to render all routes directly without sections when there are no tags
    if (tags.length === 0) {
      return [];
    }

    // Sort tags by their order in the tagOrder array, fall back to alphabetical
    const sortedTags = sortTagsByOrder(tags, tagOrder);

    // Always put untagged routes at the end
    const hasUntaggedRoutes = routesGroupedByTags[UNTAGGED]?.length > 0;
    return hasUntaggedRoutes ? [...sortedTags, UNTAGGED] : sortedTags;
  }, [routesGroupedByTags, tagOrder]);

  return { routesGroupedByTags, sortedTags };
}

export function RoutesPanel() {
  const {
    appRoutes: routes,
    tagOrder,
    activeRoute,
  } = useStudioStore("appRoutes", "tagOrder", "activeRoute");

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

  const { routesGroupedByTags, sortedTags } = useRoutesGroupedByTags(
    detectedRoutes,
    tagOrder,
  );

  const hasAnyRoutes = routes.length > 0;
  const allRoutes = useMemo(() => {
    // If no tags, just return all routes
    if (sortedTags.length === 0) {
      return routesGroupedByTags[UNTAGGED] || [];
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
              <RoutesSection
                key={typeof tag === "string" ? tag : "Symbol('untagged')"}
                title={typeof tag === "string" ? tag : "Untagged Routes"}
              >
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

/**
 * Sorts an array of tags based on a provided tag order, with fallback to alphabetical sorting.
 *
 * Tags that appear in the tagOrder array are sorted first according to their order.
 * Tags not in tagOrder are sorted alphabetically and placed after the ordered tags.
 *
 * Example:
 * ```ts
 * const tags = ["auth", "users", "admin"]
 * const order = ["users", "auth"]
 * sortTagsByOrder(tags, order) // ["users", "auth", "admin"]
 * ```
 */
function sortTagsByOrder(tags: string[], tagOrder: string[]): string[] {
  return [...tags].sort((a, b) => {
    // Get indices from tagOrder array
    const indexA = tagOrder.indexOf(a);
    const indexB = tagOrder.indexOf(b);

    // If both tags are in tagOrder, sort by their order
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    // If only one tag is in tagOrder, prioritize it
    if (indexA !== -1) {
      return -1;
    }

    if (indexB !== -1) {
      return 1;
    }

    // If neither tag is in tagOrder, fall back to alphabetical
    return a.localeCompare(b);
  });
}
