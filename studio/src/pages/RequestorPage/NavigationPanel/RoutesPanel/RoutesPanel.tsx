import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type AppRouteWithFileName,
  type TreeNode,
  useFetchFileTreeRoutes,
} from "@/queries/app-routes";
import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react";
import {
  ActivityLogIcon,
  ListBulletIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import { AddRouteButton } from "../../routes";
import { useRequestorStore } from "../../store";
import type { CollapsableTreeNode, NavigationRoutesView } from "../../store";
import type { ProbedRoute } from "../../types";
import { Search } from "../Search";
import { RouteTree } from "./RouteTree";
import { RoutesItem } from "./RoutesItem";
import { useRefreshRoutes } from "./useRefreshRoutes";

export function RoutesPanel() {
  const {
    routes,
    activeRoute,
    setActiveRoute,
    navigationPanelRoutesView: tab,
    setNavigationPanelRoutesView: setTab,
    unmatched,
    collapsibleTree,
  } = useRequestorStore(
    "routes",
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

        {hasAnyRoutes && (
          <RoutesSection title={<DetectedRoutesTitle />}>
            <TabsContent value="list" className="mt-0">
              {detectedRoutes.length === 0 ? <div className="italic text-center text-muted-foreground text-xs my-4">
                No routes match filter criteria
              </div> : <div className="grid">
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
              }
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

function RefreshRoutesButton() {
  const { refreshRoutes, isRefreshing } = useRefreshRoutes();

  return (
    <Button
      onClick={() => refreshRoutes()}
      disabled={isRefreshing}
      className={cn("bg-transparent text-muted-foreground")}
      variant="outline"
      size="sm"
    >
      <ReloadIcon
        className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")}
      />
      {isRefreshing ? "Checking..." : "Try Again"}
    </Button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300">
      <div className="mt-12 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:book-copy"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-2">No routes detected</h2>
        <div className="flex items-center mb-4">
          <RefreshRoutesButton />
        </div>
        <div className="text-gray-400 text-left text-sm flex flex-col gap-2">
          <p className="text-gray-400 mb-4 text-sm">
            To enable route auto-detection:
          </p>
          <ol className="mb-4 flex flex-col gap-2">
            <li>
              1. Add the client library (
              <a
                className="underline"
                href="https://fiberplane.com/docs/get-started"
              >
                docs
              </a>
              )
              <code className="block mt-1 bg-gray-800 p-1 pl-2 rounded">
                npm i @fiberplane/hono-otel
              </code>
            </li>
            <li className="mt-2">
              2. Set <code>FPX_ENDPOINT</code> env var to
              <code className="block mt-1 bg-gray-800 p-1 pl-2 rounded">
                http://localhost:8788/v1/traces
              </code>
            </li>
            <li className="mt-2">
              3. Restart your application and Fiberplane Studio
            </li>
          </ol>
          <p className="text-gray-400 text-sm">
            If routes are still not detected:
          </p>
          <ul className="text-left text-sm text-gray-400">
            <li>
              - Ask for help on{" "}
              <a
                href="https://discord.com/invite/cqdY6SpfVR"
                className="underline"
              >
                Discord
              </a>
            </li>
            <li>
              - File an issue on{" "}
              <a
                href="https://github.com/fiberplane/fpx/issues"
                className="underline"
              >
                Github
              </a>
            </li>
          </ul>
          <p className="text-gray-400 text-sm">
            Or you can simply add a route manually by clicking the + button
          </p>
        </div>
      </div>
    </div>
  );
}

type RoutesSectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

export function RoutesSection(props: RoutesSectionProps) {
  const { title, children } = props;

  return (
    <section className="p-2 w-full">
      <h4 className="font-medium font-mono uppercase text-xs text-muted-foreground">
        {title}
      </h4>
      <div className="space-y-0.5 overflow-y-auto mt-2 w-full overflow-x-hidden">
        {children}
      </div>
    </section>
  );
}
