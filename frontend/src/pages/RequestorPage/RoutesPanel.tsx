import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useIsMdScreen } from "@/hooks";
import { cn } from "@/utils";
import {
  CaretDownIcon,
  CaretRightIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { Resizable } from "react-resizable";
import { ResizableHandle } from "./Resizable";
import { useResizableWidth, useStyleWidth } from "./hooks";
import { getHttpMethodTextColor } from "./method";
import { ProbedRoute } from "./queries";

type RoutesPanelProps = {
  routes?: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
};

export function RoutesPanel({
  routes,
  selectedRoute,
  handleRouteClick,
}: RoutesPanelProps) {
  const isMd = useIsMdScreen();

  return isMd ? (
    <ResizableRoutes
      routes={routes}
      selectedRoute={selectedRoute}
      handleRouteClick={handleRouteClick}
    />
  ) : (
    <Routes
      routes={routes}
      selectedRoute={selectedRoute}
      handleRouteClick={handleRouteClick}
      collapsible
    />
  );
}

function ResizableRoutes({
  routes,
  selectedRoute,
  handleRouteClick,
}: RoutesPanelProps) {
  const { width, handleResize } = useResizableWidth(320);
  const styleWidth = useStyleWidth(width);

  return (
    <Resizable
      className="md:min-w-[200px]"
      width={width} // Initial width
      axis="x" // Restrict resizing to the horizontal axis
      onResize={handleResize}
      resizeHandles={["e"]} // Limit resize handle to just the east (right) handle
      handle={(_, ref) => (
        // Render a custom handle component, so we can indicate "resizability"
        // along the entire right side of the container
        <ResizableHandle ref={ref} />
      )}
    >
      <div style={styleWidth} className={cn("md:h-full")}>
        <Routes
          routes={routes}
          selectedRoute={selectedRoute}
          handleRouteClick={handleRouteClick}
          width={width}
        />
      </div>
    </Resizable>
  );
}

function Routes({
  routes,
  selectedRoute,
  handleRouteClick,
  width,
  collapsible,
}: RoutesPanelProps & { width?: number; collapsible?: boolean }) {
  const styleWidth = useStyleWidth(width);

  const [showDetectedRoutes, setShowDetectedRoutes] = useState(true);
  const ShowDetectedIcon = showDetectedRoutes ? CaretDownIcon : CaretRightIcon;
  const [isOpen, setIsOpen] = useState(false);

  const [filterValue, setFilterValue] = useState("");
  const filteredRoutes = useMemo(() => {
    const cleanFilter = filterValue.trim().toLowerCase();
    if (cleanFilter.length < 3) {
      return routes;
    }
    return routes?.filter(r => r.path.includes(filterValue))
  }, [filterValue, routes])

  return (
    <Collapsible
      className="md:h-full"
      open={collapsible ? isOpen : true}
      onOpenChange={setIsOpen}
    >
      <div
        style={styleWidth}
        className={cn(
          "flex flex-col md:h-full px-4 overflow-x-hidden border rounded-md",
        )}
      >
        <CollapsibleTrigger asChild>
          <h2 className="flex items-center justify-between rounded cursor-pointer text-base h-12 md:cursor-default">
            Endpoints
            {collapsible ? <CaretDownIcon className="h-4 w-4" /> : null}
          </h2>
        </CollapsibleTrigger>
        {/* TODO - Make internally scrollable */}
        <CollapsibleContent className="max-h-[400px] md:max-h-none md:mt-2 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Input className="text-sm" placeholder="Search endpoints" value={filterValue} onChange={(e) => setFilterValue(e.target.value)} />
              {/* TODO - Create a route? */}
              <Button variant="secondary" className="p-2.5">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="font-medium text-sm flex items-center mb-1 mt-4">
              <ShowDetectedIcon
                className="h-4 w-4 mr-0.5 cursor-pointer"
                onClick={() => {
                  setShowDetectedRoutes((current) => !current);
                }}
              />
              Detected Routes
            </div>
            {showDetectedRoutes && (
              <div className="space-y-0">
                {filteredRoutes?.map?.((route, index) => (
                  <div
                    key={index}
                    onClick={() => handleRouteClick(route)}
                    className={cn(
                      "flex items-center py-1 px-5 rounded cursor-pointer font-mono text-sm",
                      {
                        "bg-muted": selectedRoute === route,
                        "hover:bg-muted": selectedRoute !== route,
                      },
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs",
                        "min-w-12",
                        getHttpMethodTextColor(route.method),
                      )}
                    >
                      {route.method}
                    </span>
                    <span className="ml-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      {route.path}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto">{/* Settings? */}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
