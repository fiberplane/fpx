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
  if (pathname && method) {
    const smartMatch = findSmartRouterMatches(routes, pathname, method);
    if (smartMatch) {
      console.debug(`smartMatch ${method} ${pathname}`, smartMatch);
      return smartMatch;
    }
  }

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
export function findSmartRouterMatches(
  routes: ProbedRoute[],
  pathname: string,
  method: string,
  isWs?: boolean,
) {
  // HACK - We need to be able to associate route handlers back to the ProbedRoute definition
  const functionHandlerLookupTable: Map<() => void, ProbedRoute> = new Map();

  const routers = [new RegExpRouter(), new TrieRouter()];
  const router = new SmartRouter({ routers });
  for (const route of routes) {
    if (!!route.isWs === !!isWs) {
      const handler = () => {};
      router.add(route.method, route.path, handler);
      // Add the noop handler to the lookup table,
      // so if there's a match, we can use the handler to look up the OG route definition
      functionHandlerLookupTable.set(handler, route);
    }
  }
  const match = router.match(method, pathname);

  const allAreEmpty = isMatchResultEmpty(match);

  if (allAreEmpty) {
    return null;
  }

  const matches = unpackMatches(match);

  if (matches.length === 0) {
    return null;
  }

  const routeMatches = matches.map((match) => {
    const handler = match[0];
    return functionHandlerLookupTable.get(handler as () => void);
  });

  console.debug(
    "ROUTE MATCHES - what if there is more than one?",
    routeMatches,
  );

  return routeMatches[0];
}

// type Result<T> = [[T, ParamIndexMap][], ParamStash] | [[T, Params][]]
//
// - [unknown, Params][] = [unknown, Record<P extends string, string | string[]>]
// - [unknown, ParamIndexMap][] = [unknown, Record<string, number>]
// - ParamStash = string[]
const isMatchResultEmpty = <R extends SmartRouter<T>, T>(
  result: ReturnType<R["match"]>,
) => {
  if (result.length === 2) {
    return result[0].every((m) => {
      return m[0] === undefined && m[1] === undefined;
    });
  }
  if (result.length === 1) {
    return result.every((m) => {
      return m[0] === undefined && m[1] === undefined;
    });
  }
};

const unpackMatches = <R extends SmartRouter<T>, T>(
  result: ReturnType<R["match"]>,
) => {
  const matches = [];
  if (result.length === 2) {
    for (const m of result[0]) {
      if (m[0] !== undefined) {
        matches.push(m);
      }
    }
  }
  if (result.length === 1) {
    for (const m of result[0]) {
      if (m[0] !== undefined) {
        matches.push(m);
      }
    }
  }
  return matches;
};
