import { noop } from "@/utils";
import { ProbedRouteSchema, type ProbedRoute } from "../../types";
import { RoutesItem } from "./RoutesItem";
import { RoutesTreeGroup } from "./RoutesTreeGroup";

type AppRoute = {
  id: number;
  path: string | null;
  method: string | null;
  handler: string | null;
  handlerType: string | null;
  currentlyRegistered: boolean | null;
  registrationOrder: number | null;
  routeOrigin: "custom" | "discovered" | "open_api" | null;
  openApiSpec: string | null;
  requestType: "http" | "websocket" | null;
};

type AppRouteWithSourceMetadata = AppRoute & {
  fileName: string;
};

type TreeNode = {
  path: string;
  routes: Array<AppRouteWithSourceMetadata>;
  children: TreeNode[];
};

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
          // TODO: fix this type mess everywhere
          route={ProbedRouteSchema.parse({ ...route, openApiSpec: undefined })}
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
