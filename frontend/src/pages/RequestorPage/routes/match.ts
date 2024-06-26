import { ProbedRoute } from "../queries";

export function findMatchedRoute(
  routes: ProbedRoute[],
  pathname?: string,
  method?: string,
): ProbedRoute | undefined {
  for (const route of routes) {
    if (route.path === pathname && route.method === method) {
      return route;
    }
  }
  return undefined;
}
