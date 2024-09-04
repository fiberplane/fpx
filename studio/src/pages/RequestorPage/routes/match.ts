import type { ParamIndexMap, ParamStash } from "hono/router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import type { ProbedRoute } from "../queries";

type MatchedRouteResult = {
  route: ProbedRoute;
  pathParams?:
    | Record<string, string | string[]>
    | Record<string, string | number>;
} | null;

/**
 * Looks for a single matching route given the pathname, method, and request type
 * Precedence:
 * - First checks registered routes
 * - Then checks unregistered routes
 * @param routes
 * @param pathname
 * @param method
 * @param requestType
 * @returns
 */
export function findMatchedRoute(
  routes: ProbedRoute[],
  pathname: string | undefined,
  method: string | undefined,
  requestType: "http" | "websocket",
): MatchedRouteResult {
  const registeredRoutes = routes.filter((r) => r.currentlyRegistered);
  const registeredMatch = findMatchedRouteHelper(
    registeredRoutes,
    pathname,
    method,
    requestType,
  );

  if (registeredMatch) {
    return registeredMatch;
  }

  const unregisteredRoutes = routes.filter((r) => !r.currentlyRegistered);
  const unregisteredMatch = findMatchedRouteHelper(
    unregisteredRoutes,
    pathname,
    method,
    requestType,
  );

  if (unregisteredMatch) {
    return unregisteredMatch;
  }

  return null;
}

/**
 * Looks for a single matching route
 * If the router throws an error when matching, we return the first registered route that matches exactly on:
 * - pathname
 * - method
 * - requestType
 */
function findMatchedRouteHelper(
  routes: ProbedRoute[],
  pathname: string | undefined,
  method: string | undefined,
  requestType: "http" | "websocket",
) {
  if (pathname && method) {
    // HACK - First search registered routes, then search unregistered routes
    const smartMatch = findFirstSmartRouterMatch(
      routes,
      pathname,
      method,
      requestType,
    );

    if (smartMatch?.route) {
      return smartMatch;
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
      const pathParams = match[1];
      return {
        route: functionHandlerLookupTable.get(handler as () => void),
        pathParams,
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

/**
 * Transforms a route match result into an array of matches with path parameter values
 */
const unpackMatches = <R extends SmartRouter<T>, T>(
  result: ReturnType<R["match"]>,
) => {
  const matches = [];
  if (result.length === 2) {
    for (const m of result[0]) {
      if (m[0] !== undefined) {
        const handler = m[0];
        const paramIndexMap = m[1];
        const paramStash = result[1];
        const pathParams = paramIndexMapToObject(paramIndexMap, paramStash);
        matches.push([handler, pathParams] as [
          unknown,
          Record<string, string>,
        ]);
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

const paramIndexMapToObject = (
  paramIndexMap: ParamIndexMap,
  paramStash: ParamStash,
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(paramIndexMap).map(([key, value]) => {
      // For a RegExpRouter, the paramStash is the result of a regex match
      // and the values are the indices of the parsed values in the match
      // so we need to map the indices to the actual values
      const actualValue = paramStash?.[value];
      return [key, actualValue];
    }),
  );
};
