import type { AppRoute } from "../../db/schema.js";
import { findAllSmartRouterMatches, findMatchedRoute } from "./match.js";

export function getMatchingMiddleware(
  routes: AppRoute[],
  routesAndMiddleware: AppRoute[],
  path: string,
  method: string,
  requestType: "http" | "websocket",
) {
  const matchedRoute = findMatchedRoute(
    routes,
    path,
    // removeBaseUrl(serviceBaseUrl, path),
    method,
    requestType,
  )?.route;

  if (!matchedRoute) {
    return null;
  }

  const indexOfMatchedRoute = matchedRoute
    ? routesAndMiddleware.indexOf(matchedRoute)
    : -1;

  // NOTE - `routesAndMiddleware` is already filtered for all registered handlers
  //        and sorted in descending order by registration order.
  //        (So the last element is the most recently registered)
  //        This is why we can just slice the array from the matched route
  //        index onwards and only check for matching middleware.
  const registeredHandlersBeforeRoute =
    indexOfMatchedRoute > -1
      ? routesAndMiddleware.slice(indexOfMatchedRoute)
      : [];

  const filteredMiddleware = registeredHandlersBeforeRoute.filter(
    (r) => r.handlerType === "middleware",
  );

  const middlewareMatches = findAllSmartRouterMatches(
    filteredMiddleware,
    path,
    method,
    requestType,
  );

  const middleware = [];
  for (const m of middlewareMatches ?? []) {
    if (m?.route && m.route?.handlerType === "middleware") {
      middleware.push(m.route);
    }
  }
  return middleware;
}
