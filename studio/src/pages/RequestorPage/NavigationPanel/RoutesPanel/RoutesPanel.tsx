import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AppRouteWithFileName,
  type TreeNode,
  useFetchFileTreeRoutes,
} from "@/queries/app-routes";
import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import {
  ActivityLogIcon,
  ListBulletIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import { AddRouteButton } from "../../routes";
import type { CollapsableTreeNode, NavigationRoutesView } from "../../store";
import { useStudioStore } from "../../store";
import type { ProbedRoute } from "../../types";
import { Search } from "../Search";
import { EmptyState } from "./EmptyState";
import { RouteTree } from "./RouteTree";
import { RoutesItem } from "./RoutesItem";
import { RoutesSection } from "./RoutesSection";
import { useRefreshRoutes } from "./useRefreshRoutes";

export function RoutesPanel() {
  const {
    appRoutes: routes,
    activeRoute,
    setActiveRoute,
    navigationPanelRoutesView: tab,
    setNavigationPanelRoutesView: setTab,
    unmatched,
    collapsibleTree,
  } = useStudioStore(
    "appRoutes",
    "activeRoute",
    "unmatched",
    "collapsibleTree",
    "setActiveRoute",
    "navigationPanelRoutesView",
    "setNavigationPanelRoutesView",
  );

  const navigate = useNavigate();

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
    return routes.some((r) => r.routeOrigin === "custom" && !r.isDraft);
  }, [routes]);

  const hasAnyOpenApiRoutes = useMemo(() => {
    return routes.some((r) => r.routeOrigin === "open_api");
  }, [routes]);

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

  const openApiRoutes = useMemo(() => {
    return filteredRoutes.filter((r) => r.routeOrigin === "open_api");
  }, [filteredRoutes]);

  const userAddedRoutes = useMemo(() => {
    return filteredRoutes.filter(
      (r) => r.routeOrigin === "custom" && !r.isDraft,
    );
  }, [filteredRoutes]);

  // Trigger fetching of the file tree data
  useFetchFileTreeRoutes();

  const filteredTreeRoutes = useMemo(() => {
    const cleanFilter = filterValue.trim().toLowerCase();
    if (cleanFilter.length < 3) {
      return {
        tree: collapsibleTree,
        unmatched,
      };
    }

    return {
      tree: filterTree(collapsibleTree, cleanFilter),
      unmatched: unmatched.filter((route) =>
        route.path.toLowerCase().includes(cleanFilter),
      ),
    };
  }, [filterValue, unmatched, collapsibleTree]);

  function filterTree(
    nodes: Array<CollapsableTreeNode>,
    cleanFilter: string,
  ): Array<TreeNode> {
    return nodes?.map((node) => {
      const routes = node.routes.filter((route) =>
        route.path?.toLowerCase().includes(cleanFilter),
      );

      const children = filterTree(node.children, cleanFilter);

      return { ...node, routes, children };
    });
  }

  const flattenedTreeRoutes = useMemo(() => {
    const getRoutes = (
      node: CollapsableTreeNode,
    ): Array<AppRouteWithFileName> => {
      if (node.collapsed) {
        return [];
      }

      return [
        ...node.routes,
        ...node.children.flatMap((child) => getRoutes(child)),
      ];
    };

    if (!filteredTreeRoutes) {
      return [];
    }
    return [
      ...filteredTreeRoutes.tree.flatMap(
        (node) => getRoutes(node),
        ...filteredTreeRoutes.unmatched,
      ),
    ];
  }, [filteredTreeRoutes]);

  const hasAnyRoutes = routes.length > 0;
  const visibleRoutes = tab === "list" ? detectedRoutes : flattenedTreeRoutes;
  const allRoutes = useMemo(() => {
    return [...userAddedRoutes, ...visibleRoutes, ...openApiRoutes];
  }, [userAddedRoutes, visibleRoutes, openApiRoutes]);

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

  const handleItemSelect = (index: number) => {
    if (allRoutes[index]) {
      handleRouteClick(allRoutes[index]);
    }
  };

  const selectedRoute =
    selectedRouteIndex !== null ? allRoutes[selectedRouteIndex] : null;

  return (
    <Tabs
      value={tab}
      className={cn("h-full", "flex", "flex-col")}
      onValueChange={(tabValue: string) =>
        setTab(tabValue as NavigationRoutesView)
      }
    >
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
          <AddRouteButton />
        </div>
      </div>
      <div className="overflow-y-auto h-full relative flex flex-col gap-2">
        {hasAnyRoutes && (
          <RoutesSection title={<DetectedRoutesTitle />}>
            <TabsContent value="list" className="mt-0">
              {detectedRoutes.length === 0 ? (
                <div className="italic text-center text-muted-foreground text-xs my-4">
                  No routes match filter criteria
                </div>
              ) : (
                <div className="grid">
                  {detectedRoutes.map((route, index) => (
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
                </div>
              )}
            </TabsContent>
            <TabsContent value="fileTree" className="mt-0">
              {filteredTreeRoutes?.tree.map((tree) => (
                <RouteTree
                  key={tree.path}
                  tree={tree}
                  activeRoute={activeRoute}
                  selectedRoute={selectedRoute}
                  userAddedRoutes={userAddedRoutes}
                  handleRouteClick={handleRouteClick}
                />
              ))}
              {filteredTreeRoutes &&
                filteredTreeRoutes.unmatched.length > 0 && (
                  <div className="mt-4">
                    <span className="font-medium font-mono text-xs text-muted-foreground">
                      Unmatched routes
                    </span>
                    {filteredTreeRoutes.unmatched.map((route, index) => (
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
                  </div>
                )}
            </TabsContent>
          </RoutesSection>
        )}

        {hasAnyUserAddedRoutes && (
          <RoutesSection title="Custom routes">
            {userAddedRoutes.map((route, index) => (
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

        {hasAnyOpenApiRoutes && (
          <RoutesSection title="OpenAPI">
            {openApiRoutes.map((route, index) => (
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
        {!hasAnyRoutes && <EmptyState />}
      </div>
    </Tabs>
  );
}

function DetectedRoutesTitle() {
  const { refreshRoutes, isRefreshing } = useRefreshRoutes();

  return (
    <div className="flex">
      <button
        type="button"
        className={cn(
          "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
          isRefreshing && "opacity-80",
          isRefreshing && "cursor-default",
        )}
        disabled={isRefreshing}
        onClick={() => {
          if (!isRefreshing) {
            refreshRoutes();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            if (!isRefreshing) {
              refreshRoutes();
            }
          }
        }}
        tabIndex={0}
      >
        Detected in app{" "}
        <ReloadIcon className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
      </button>
      <TabsList className="ml-auto -mr-2">
        <TabsTrigger value="list">
          <ListBulletIcon />
        </TabsTrigger>
        <TabsTrigger value="fileTree">
          <ActivityLogIcon className="h-3 w-3" />
        </TabsTrigger>
      </TabsList>
    </div>
  );
}
