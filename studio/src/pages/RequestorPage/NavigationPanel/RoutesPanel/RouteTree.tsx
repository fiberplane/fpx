import type { TreeNode } from "@/queries/app-routes";
import { noop } from "@/utils";
import type { ProbedRoute } from "../../types";
import { RoutesItem } from "./RoutesItem";
import { RoutesTreeGroup } from "./RoutesTreeGroup";

export function RouteTree({
  tree,
  activeRoute,
  userAddedRoutes,
  handleRouteClick,
}: {
  activeRoute: ProbedRoute | null;
  tree: TreeNode;
  userAddedRoutes: Array<ProbedRoute>;
  handleRouteClick: (route: ProbedRoute) => void;
}) {
  return (
    <RoutesTreeGroup key={tree.path} filePath={tree.path}>
      {tree.children.map((child) => (
        <RouteTree
          key={child.path}
          tree={child}
          userAddedRoutes={userAddedRoutes}
          handleRouteClick={handleRouteClick}
          activeRoute={activeRoute}
        />
      ))}
      {tree.routes.map((route, index) => (
        <RoutesItem
          key={index}
          index={userAddedRoutes.length + index}
          route={route}
          selectedRoute={null}
          activeRoute={activeRoute}
          handleRouteClick={handleRouteClick}
          // TODO: fix index based nav in tree
          setSelectedRouteIndex={noop}
        />
      ))}
    </RoutesTreeGroup>
  );
}
