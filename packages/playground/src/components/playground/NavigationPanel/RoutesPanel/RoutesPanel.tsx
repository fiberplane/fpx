import { cn } from "@/utils";
import { useNavigate } from "@tanstack/react-router";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useStudioStore } from "../../store";
import { getRouteId } from "../../store/slices/requestResponseSlice";
import type { ApiRoute } from "../../types";
import { Search } from "../Search";
import { RoutesItem } from "./RoutesItem";
import { RoutesSection } from "./RoutesSection";

const UNTAGGED = Symbol("untagged");

function useRoutesGroupedByTags(routes: ApiRoute[], tagOrder: string[]) {
  const routesGroupedByTags = useMemo(() => {
    return routes.reduce<Record<string | symbol, ApiRoute[]>>((acc, route) => {
      // NOTE - Also group routes without tags under the "untagged" tag
      const tags = route.operation.tags?.length
        ? route.operation.tags
        : [UNTAGGED];

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

// New component for virtualized routes list
function VirtualizedRoutesList({
  routes,
  selectedRouteIndex,
  activeRoute,
  setSelectedRouteIndex,
}: {
  routes: Array<ApiRoute>;
  selectedRouteIndex: number | null;
  activeRoute: ApiRoute | null;
  setSelectedRouteIndex: (index: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: routes.length,
    getScrollElement: () => ref.current,
    estimateSize: () => 28, // Estimate row height
  });

  return (
    <div ref={ref} className="overflow-y-auto h-full">
      <div style={{ height: rowVirtualizer.getTotalSize() }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const route = routes[virtualRow.index];
          return (
            <div
              key={getRouteId(route)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <RoutesItem
                key={`${route.method}-${route.path}`}
                index={virtualRow.index}
                route={route}
                selectedRoute={
                  selectedRouteIndex === virtualRow.index ? route : null
                }
                activeRoute={activeRoute}
                setSelectedRouteIndex={setSelectedRouteIndex}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// New component for virtualized routes sections
function VirtualizedRoutesSections({
  sortedTags,
  routesGroupedByTags,
  allRoutes,
  activeRoute,
  selectedRouteIndex,
  setSelectedRouteIndex,
}: {
  sortedTags: Array<string | symbol>;
  allRoutes: Array<ApiRoute>;
  routesGroupedByTags: Record<string | symbol, ApiRoute[]>;
  activeRoute: ApiRoute | null;
  selectedRouteIndex: number | null;
  setSelectedRouteIndex: (index: number | null) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: sortedTags.length,
    getScrollElement: () => ref.current,
    scrollMargin: 20,
    estimateSize: (index) => {
      const tag = sortedTags[index];
      return (routesGroupedByTags[tag]?.length || 0) * 28 + 40; // Estimate height based on number of items
    },
  });

  return (
    <div ref={ref} className="overflow-y-auto h-full grid">
      <div
        className="relative w-full"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const tag = sortedTags[virtualRow.index];
          return (
            <div
              key={String(tag)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                transform: `translateY(${
                  virtualRow.start - rowVirtualizer.options.scrollMargin
                }px)`,
              }}
            >
              <RoutesSection
                key={typeof tag === "string" ? tag : "Symbol('untagged')"}
                title={typeof tag === "string" ? tag : "Untagged Routes"}
              >
                <div className="grid">
                  {routesGroupedByTags[tag].map((route) => {
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
            </div>
          );
        })}
      </div>
    </div>
  );
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
      const matchesSummary = r.operation.summary
        ?.toLowerCase()
        .includes(cleanFilter);
      const matchesTags = r.operation.tags?.some((tag) =>
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
      <div className="h-full relative flex flex-col gap-2 overflow-hidden">
        {hasAnyRoutes &&
          (detectedRoutes.length === 0 ? (
            <div className="italic text-center text-muted-foreground text-xs my-4">
              No routes match filter criteria
            </div>
          ) : sortedTags.length === 0 ? (
            // Use the new VirtualizedRoutesList component
            <VirtualizedRoutesList
              routes={allRoutes}
              selectedRouteIndex={selectedRouteIndex}
              activeRoute={activeRoute}
              setSelectedRouteIndex={setSelectedRouteIndex}
            />
          ) : (
            // Use the new VirtualizedRoutesSections component
            <VirtualizedRoutesSections
              sortedTags={sortedTags}
              allRoutes={allRoutes}
              routesGroupedByTags={routesGroupedByTags}
              activeRoute={activeRoute}
              selectedRouteIndex={selectedRouteIndex}
              setSelectedRouteIndex={setSelectedRouteIndex}
            />
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
