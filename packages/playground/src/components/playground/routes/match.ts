import type { ApiRoute } from "../types";

type MatchedRouteResult = {
  route: ApiRoute;
  pathParams?:
    | Record<string, string | string[]>
    | Record<string, string | number>;
} | null;

/**
 * Converts an OpenAPI-style path pattern to a regex pattern
 * e.g. /users/{id} -> /users/([^/]+)
 */
function pathToRegex(path: string): RegExp {
  const pattern = path.replace(/\{([^}]+)\}/g, "([^/]+)");
  return new RegExp(`^${pattern}$`);
}

/**
 * Extracts parameter names from an OpenAPI-style path
 * e.g. /users/{id}/posts/{postId} -> ["id", "postId"]
 */
function extractParamNames(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g) || [];
  return matches.map((match) => match.slice(1, -1));
}

/**
 * Looks for a single matching route given the pathname and method
 */
export function findMatchedRoute(
  routes: ApiRoute[],
  pathname: string | undefined,
  method: string | undefined,
): MatchedRouteResult {
  if (!pathname || !method) {
    return null;
  }

  for (const route of routes) {
    if (route.method !== method) {
      continue;
    }

    // Exact match
    if (route.path === pathname) {
      return { route };
    }

    // Check for parameterized match
    const regex = pathToRegex(route.path);
    const match = pathname.match(regex);

    if (match) {
      const paramNames = extractParamNames(route.path);
      const paramValues = match.slice(1); // First element is the full match

      const pathParams = Object.fromEntries(
        paramNames.map((name, index) => [name, paramValues[index]]),
      );

      return {
        route,
        pathParams,
      };
    }
  }

  return null;
}
