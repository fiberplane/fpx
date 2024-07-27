import { noop } from "@/utils";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import { ProbedRoute } from "../queries";

export function findMatchedRoute(
  routes: ProbedRoute[],
  pathname?: string,
  method?: string,
  isWs?: boolean,
): ProbedRoute | undefined {
  for (const route of routes) {
    if (
      route.path === pathname &&
      route.method === method &&
      !!route.isWs === !!isWs
    ) {
      return route;
    }
  }
  return undefined;
}

/**
 * Prototype of doing route matching in the browser with Hono itself
 */
export function findSmartRouterMatch(
  routes: ProbedRoute[],
  pathname: string,
  method: string,
) {
  const routers = [new RegExpRouter(), new TrieRouter()];
  const router = new SmartRouter({ routers });
  for (const route of routes) {
    router.add(route.method, route.path, noop);
  }
  const match = router.match(method, pathname);
  return match;
}
