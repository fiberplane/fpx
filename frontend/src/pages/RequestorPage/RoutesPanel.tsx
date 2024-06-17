import { cn } from "@/utils";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Resizable } from "react-resizable";
import { ResizableHandle } from "./Resizable";
import { useResizableWidth } from "./hooks";
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
  const [showDetectedRoutes, setShowDetectedRoutes] = useState(true);
  const ShowDetectedIcon = showDetectedRoutes ? CaretDownIcon : CaretRightIcon;

  const { width, handleResize } = useResizableWidth(320);

  return (
    <Resizable
      className="min-w-[200px]"
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
      <div
        style={{ width: `${width}px` }}
        className={cn("flex flex-col px-4 overflow-x-hidden border-r")}
      >
        <h2 className="flex items-center rounded font-semibold">Endpoints</h2>
        <div className="flex-grow mt-4">
          <div className="">
            <div className="font-medium text-sm flex items-center mb-1">
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
                {routes?.map?.((route, index) => (
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
        </div>
        <div className="mt-auto">{/* Settings? */}</div>
      </div>
    </Resizable>
  );
}
