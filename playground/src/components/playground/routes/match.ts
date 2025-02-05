import type { ParamIndexMap, ParamStash } from "hono/router";
import { RegExpRouter } from "hono/router/reg-exp-router";
import { SmartRouter } from "hono/router/smart-router";
import { TrieRouter } from "hono/router/trie-router";
import type { ApiRoute } from "../types";

type MatchedRouteResult = {
  route: ApiRoute;
  pathParams?:
    | Record<string, string | string[]>
    | Record<string, string | number>;
} | null;

/**
 * Looks for a single matching route given the pathname, method, and request type
 * Precedence should always occur as follows:
 * - First checks registered routes
 * - Then checks unregistered routes
 *
 * As of writing, precedence is enforced via sorting the routes (in a helper function for finding smart router matches)
 *
 * If the router throws an error when matching, we return the first route that matches exactly on:
 * - pathname
 * - method
 * - requestType
 *
 * @param routes
 * @param pathname
 * @param method
 * @param requestType
 * @returns
 */
export function findMatchedRoute(
  routes: ApiRoute[],
  pathname: string | undefined,
  method: string | undefined,
): MatchedRouteResult {
  if (pathname && method) {
    const smartMatch = findFirstSmartRouterMatch(routes, pathname, method);

    if (smartMatch?.route) {
      return { route: smartMatch.route, pathParams: smartMatch.pathParams };
    }
  }

  // HACK - This is a backup in case the smart router throws an error
  for (const route of routes) {
    if (route.path === pathname && route.method === method) {
      return { route };
    }
  }

  return null;
}

/**
 * Return the first matching route (or middleware!) from the smart router
 */
export function findFirstSmartRouterMatch(
  routes: ApiRoute[],
  pathname: string,
  method: string,
) {
  return findAllSmartRouterMatches(routes, pathname, method)?.[0] ?? null;
}

/**
 * Returns all matching routes (or middleware!) from the smart router
 */
export function findAllSmartRouterMatches(
  unsortedRoutes: ApiRoute[],
  pathname: string,
  method: string,
) {
  // HACK - Sort with registered routes first, then unregistered routes
  //        Look at the sortRoutesForMatching function for more details
  const routes = sortRoutesForMatching(unsortedRoutes);

  // HACK - We need to be able to associate route handlers back to the ApiRoute definition
  const functionHandlerLookupTable: Map<() => void, ApiRoute> = new Map();

  const routers = [new RegExpRouter(), new TrieRouter()];
  const router = new SmartRouter({ routers });
  for (const route of routes) {
    if (route.method && route.path) {
      const handler = () => {};
      router.add(route.method, route.path, handler);
      // Add the noop handler to the lookup table,
      // so if there's a match, we can use the handler to look up the OG route definition
      functionHandlerLookupTable.set(handler, route);
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
 * @TODO - Remove this, we no longer need to sort routes for matching
 */
function sortRoutesForMatching(unsortedRoutes: ApiRoute[]) {
  const routes = [...unsortedRoutes];

  return routes;
}

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
