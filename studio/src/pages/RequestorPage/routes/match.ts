import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import type { ProbedRoute } from "../queries";

type MatchedRouteResult = {
  route: ProbedRoute;
  pathParamValues?:
    | Record<string, string | string[]>
    | Record<string, string | number>;
} | null;

export function findMatchedRoute(
  routes: ProbedRoute[],
  pathname: string | undefined,
  method: string | undefined,
  requestType: "http" | "websocket",
): MatchedRouteResult {
  if (pathname && method) {
    const smartMatch = findFirstSmartRouterMatch(
      routes,
      pathname,
      method,
      requestType,
    );
    if (smartMatch?.route) {
      return {
        route: smartMatch.route,
        pathParamValues: smartMatch.pathParams,
      };
    }
  }

  // HACK - This is a backup in case the smart router throws an error
  for (const route of routes) {
    if (
      route.path === pathname &&
      route.method === method &&
      route.requestType === requestType
    ) {
      return { route };
    }
  }

  return null;
}

/**
 * Return the first matching route (or middleware!) from the smart router
 */
export function findFirstSmartRouterMatch(
  routes: ProbedRoute[],
  pathname: string,
  method: string,
  requestType: "http" | "websocket",
) {
  return (
    findAllSmartRouterMatches(routes, pathname, method, requestType)?.[0] ??
    null
  );
}

/**
 * Returns all matching routes (or middleware!) from the smart router
 */
export function findAllSmartRouterMatches(
  routes: ProbedRoute[],
  pathname: string,
  method: string,
  requestType: "http" | "websocket",
) {
  // HACK - We need to be able to associate route handlers back to the ProbedRoute definition
  const functionHandlerLookupTable: Map<() => void, ProbedRoute> = new Map();

  const routers = [new RegExpRouter(), new TrieRouter()];
  const router = new SmartRouter({ routers });
  for (const route of routes) {
    if (route.requestType === requestType) {
      if (route.method && route.path) {
        const handler = () => {};
        router.add(route.method, route.path, handler);
        // Add the noop handler to the lookup table,
        // so if there's a match, we can use the handler to look up the OG route definition
        functionHandlerLookupTable.set(handler, route);
      }
    }
  }

  // Matching against a pathname like `/users/:` will throw,
  // so we need to be defensive
  try {
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
      return {
        route: functionHandlerLookupTable.get(handler as () => void),
        pathParams: match[1],
      };
    });

    // Sort draft routes after non-draft routes
    routeMatches.sort((a, b) => {
      const aIsDraft = !!a?.route?.isDraft;
      const bIsDraft = !!b?.route?.isDraft;
      if (aIsDraft && bIsDraft) {
        return 0;
      }
      if (aIsDraft) {
        return 1;
      }
      if (bIsDraft) {
        return -1;
      }
      return 0;
    });

    return routeMatches;
  } catch (e) {
    console.error("Error matching routes", e);
    return null;
  }
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
