export {
  useMakeProxiedRequest,
  type MakeProxiedRequestQueryFn,
} from "./useMakeProxiedRequest";
export { useOpenApiParse } from "./useOpenApiParse";
export { useProbedRoutes } from "./useProbedRoute";

export type Route = {
  path: string;
  method: string;
  handler?: string;
  handlerType?: "route" | "middleware";
  routeOrigin?: "discovered" | "custom" | "open_api";
  openApiSpec?: string;
  requestType?: "http" | "websocket";
  // NOTE - Added on the frontend, not stored in DB
  isDraft?: boolean;
};
