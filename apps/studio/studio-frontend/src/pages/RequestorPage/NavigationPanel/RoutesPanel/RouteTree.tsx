import { noop } from "@/utils";
import type { CollapsableTreeNode } from "../../store/types";
import type { ProbedRoute } from "../../types";
import { RoutesItem } from "./RoutesItem";
import { RoutesTreeGroup } from "./RoutesTreeGroup";

export function RouteTree({
  tree,
  activeRoute,
  selectedRoute,
  userAddedRoutes,
  handleRouteClick,
  level = 0,
}: {
  activeRoute: ProbedRoute | null;
  selectedRoute: ProbedRoute | null;
  tree: CollapsableTreeNode;
  userAddedRoutes: Array<ProbedRoute>;
  handleRouteClick: (route: ProbedRoute) => void;
  level?: number;
}) {
  return (
    <RoutesTreeGroup
      key={tree.path}
      filePath={tree.path}
      level={level}
      collapsed={tree.collapsed}
    >
      {tree.children.map((child) => (
        <RouteTree
          key={child.path}
          tree={child}
          selectedRoute={selectedRoute}
          level={level + 1}
          userAddedRoutes={userAddedRoutes}
          handleRouteClick={handleRouteClick}
          activeRoute={activeRoute}
        />
      ))}
      {tree.routes.map((route, index) => (
        <RoutesItem
          key={index}
          index={userAddedRoutes.length + index}
          // HACk: nullish into optional workaround
          route={{ ...route, openApiSpec: route.openApiSpec ?? undefined }}
          selectedRoute={selectedRoute}
          activeRoute={activeRoute}
          handleRouteClick={handleRouteClick}
          // TODO: fix index based nav in tree
          setSelectedRouteIndex={noop}
        />
      ))}
    </RoutesTreeGroup>
  );
}
