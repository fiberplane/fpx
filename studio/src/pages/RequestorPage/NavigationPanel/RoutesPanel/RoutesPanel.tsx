import { Input } from "@/components/ui/input";
import { useInputFocusDetection } from "@/hooks";
import { cn } from "@/utils";
import { useHandler } from "@fiberplane/hooks";
import { Icon } from "@iconify/react";
import { memo, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import { AddRouteButton } from "../../routes";
import { useRequestorStore } from "../../store";
import type { ProbedRoute } from "../../types";
import { RoutesItem } from "./RoutesItem";
import { KeyboardShortcutKey } from "@/components/KeyboardShortcut";

export function RoutesPanel() {
  const { routes } = useRequestorStore("routes");

  return (
    <div className={cn("h-full", "flex", "flex-col")}>
      <RoutesPanelInner routes={routes} />
    </div>
  );
}

function RoutesPanelInner({ routes }: { routes: ProbedRoute[] }) {
  const { activeRoute, setActiveRoute } = useRequestorStore(
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
    return routes.some((r) => r.routeOrigin === "custom" && !r.isDraft);
  }, [routes]);

  const hasAnyOpenApiRoutes = useMemo(() => {
    return routes.some((r) => r.routeOrigin === "open_api");
  }, [routes]);

  const [filterValue, setFilterValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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

  const allRoutes = useMemo(() => {
    return [...userAddedRoutes, ...detectedRoutes, ...openApiRoutes];
  }, [userAddedRoutes, detectedRoutes, openApiRoutes]);

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

  useHotkeys(
    ["Escape", "Enter"],
    (event) => {
      switch (event.key) {
        case "Enter": {
          if (
            document.activeElement === searchRef.current &&
            allRoutes.length > 0
          ) {
            setSelectedRouteIndex(0);
            const firstRouteElement = document.getElementById(
              `route-${selectedRouteIndex}`,
            );
            if (firstRouteElement) {
              firstRouteElement.focus();
            }
            break;
          }

          if (selectedRouteIndex !== null && allRoutes[selectedRouteIndex]) {
            handleRouteClick(allRoutes[selectedRouteIndex]);
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
    <>
      <div>
        <div className="flex items-center space-x-2 pb-3">
          <div className="relative flex-grow">
            <Input
              ref={searchRef}
              className={cn(
                "text-sm",
                isFocused || filterValue ? "pl-2" : "pl-24",
              )}
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              onFocus={() => {
                setSelectedRouteIndex(null);
                setIsFocused(true);
              }}
              onBlur={() => setIsFocused(false)}
            />
            {!isFocused && !filterValue && (
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <span className="text-muted-foreground text-xs">Type</span>
                <KeyboardShortcutKey>/</KeyboardShortcutKey>
                <span className="text-muted-foreground text-xs">
                  to search routes
                </span>
              </div>
            )}
          </div>
          <AddRouteButton />
        </div>
      </div>
      <div className="overflow-y-auto h-full relative">
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

        <RoutesSection title="Detected in app">
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
        </RoutesSection>

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
        {allRoutes.length === 0 && <EmptyState />}
      </div>
    </>
  );
}

const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-gray-300 h-full">
      <div className="py-8 px-2 rounded-lg flex flex-col items-center text-center">
        <div className="rounded-lg p-2 bg-muted mb-2">
          <Icon
            icon="lucide:book-copy"
            className="w-12 h-12 text-gray-400 stroke-1"
          />
        </div>
        <h2 className="text-lg font-normal mb-4">No routes detected</h2>
        <div className="text-gray-400 text-left text-sm flex flex-col gap-2">
          <p className="text-gray-400 mb-4 text-sm">
            To enable route auto-detection:
          </p>
          <ol className="mb-4 flex flex-col gap-2">
            <li>
              1. Install and add the client library:
              <code className="block mt-1 bg-gray-800 p-1 pl-2 rounded">
                npm i @fiberplane/hono-otel
              </code>
              Read more about using the client library on the{" "}
              <a
                className="underline"
                href="https://fiberplane.com/docs/get-started"
              >
                docs
              </a>
            </li>
            <li className="mt-2">
              2. Set <code>FPX_ENDPOINT</code> environment variable to:
              <code className="block mt-1 bg-gray-800 p-1 pl-2 rounded">
                http://localhost:8788/v1/traces
              </code>
              in the <code>.dev.vars</code> file in your project
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
});

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
