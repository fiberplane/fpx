import { cn } from "@/utils";
import { CaretDownIcon, CaretRightIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import type { ProbedRoute } from "../../types";
import { RouteItem } from "./RouteItem";

type RoutesSectionProps = {
  title: string;
  routes: ProbedRoute[];
  selectedRoute: ProbedRoute | null;
  handleRouteClick: (route: ProbedRoute) => void;
};

export function RoutesSection(props: RoutesSectionProps) {
  const { title, routes, selectedRoute, handleRouteClick } = props;

  const [showRoutesSection, setShowRoutesSection] = useState(true);
  const ShowRoutesSectionIcon = showRoutesSection
    ? CaretDownIcon
    : CaretRightIcon;

  return (
    <>
      <div
        className="font-medium text-sm flex items-center mb-2 mt-4"
        onKeyUp={(e) => {
          if (e.key === "Enter") {
            setShowRoutesSection((current) => !current);
          }
        }}
        onClick={() => {
          setShowRoutesSection((current) => !current);
        }}
      >
        <ShowRoutesSectionIcon className="h-4 w-4 mr-0.5 cursor-pointer" />
        {title}
      </div>
      {showRoutesSection && (
        <div className="space-y-0.5 overflow-y-auto">
          {routes?.map?.((route, index) => (
            <div
              key={index}
              onClick={() => handleRouteClick(route)}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  handleRouteClick(route);
                }
              }}
              className={cn(
                "flex items-center py-1 pl-5 pr-2 rounded cursor-pointer font-mono text-sm",
                {
                  "bg-muted": selectedRoute === route,
                  "hover:bg-muted": selectedRoute !== route,
                },
              )}
            >
              <RouteItem route={route} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
