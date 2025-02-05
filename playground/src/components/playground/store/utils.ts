import type { findMatchedRoute } from "../routes";
import type { ApiRoute } from "../types";
import type { RequestMethod } from "../types";
import type { Authorization } from "./slices/settingsSlice";
import type { KeyValueParameter, PlaygroundState } from "./types";

export const _getActiveRoute = (state: PlaygroundState): ApiRoute => {
  return (
    state.activeRoute ?? {
      id: Number.NEGATIVE_INFINITY,
      path: state.path,
      method: state.method,
      openApiSpec: null,
    }
  );
};

export function apiRouteToInputMethod(route: ApiRoute): RequestMethod {
  const method = route.method.toUpperCase();
  switch (method) {
    case "GET":
      return "GET";
    case "POST":
      return "POST";
    case "PUT":
      return "PUT";
    case "DELETE":
      return "DELETE";
    case "OPTIONS":
      return "OPTIONS";
    case "PATCH":
      return "PATCH";
    case "HEAD":
      return "HEAD";
    case "TRACE":
      return "TRACE";
    default:
      return "GET";
  }
}

/**
 * Extracts path parameters from a path using OpenAPI-style format
 * e.g. /users/{id} instead of /users/:id
 *
 * @param path
 * @returns
 */
export function extractPathParams(path: string) {
  const regex = /\/{([^}]+)}/g;

  const result: Array<string> = [];
  let lastIndex = -1;
  while (true) {
    const match = regex.exec(path);

    if (match === null) {
      break;
    }

    // Check if the regex is stuck in an infinite loop
    if (regex.lastIndex === lastIndex) {
      break;
    }
    lastIndex = regex.lastIndex;

    // Extract the parameter name from inside the curly braces
    const paramName = match[1];
    result.push(paramName);
  }
  return result;
}

export function mapPathParamKey(key: string) {
  return { key, value: "", id: key, enabled: false };
}

export function extractMatchedPathParams(
  matchedRoute: ReturnType<typeof findMatchedRoute>,
) {
  return Object.entries(matchedRoute?.pathParams ?? {}).map(([key, value]) => {
    const nextValue = value === `{${key}}` ? "" : value;
    return {
      ...mapPathParamKey(key),
      value: nextValue,
      enabled: !!nextValue,
    };
  });
}

/**
 * Given an OpenAPI path and a list of path parameters,
 * replace the path parameters in the path with the actual values
 */
export function resolvePathWithParameters(
  path: string,
  pathParams: KeyValueParameter[],
) {
  return pathParams.reduce((acc, param) => {
    return acc.replace(`{${param.key}}`, param.value || param.key);
  }, path);
}

/**
 * Removes the base url from a path so we can try to match a route...
 */
export const removeBaseUrl = (serviceBaseUrl: string, path: string) => {
  if (!pathHasValidBaseUrl(path)) {
    return path;
  }

  if (!pathHasValidBaseUrl(serviceBaseUrl)) {
    return path;
  }

  const serviceHost = new URL(serviceBaseUrl).host;
  const servicePort = new URL(serviceBaseUrl).port;

  const pathHost = new URL(path).host;
  const pathPort = new URL(path).port;

  // TODO - Make this work with query params!!!
  if (pathHost === serviceHost && pathPort === servicePort) {
    return new URL(path).pathname;
  }

  return path;
};

type AddBaseUrlOptions = {
  forceChangeHost?: boolean;
};

export const addBaseUrl = (
  serviceBaseUrl: string,
  path: string,
  options: AddBaseUrlOptions = {
    forceChangeHost: false,
  },
) => {
  const { forceChangeHost } = options;
  // NOTE - This is necessary to allow the user to type new base urls... even though we replace the base url whenever they switch routes
  if (pathHasValidBaseUrl(path) && !forceChangeHost) {
    return path;
  }

  // HACK - Fix this later, not a great pattern
  if (pathHasValidBaseUrl(path) && forceChangeHost) {
    const safeBaseUrl = serviceBaseUrl.endsWith("/")
      ? serviceBaseUrl.slice(0, -1)
      : serviceBaseUrl;
    const parsedPath = new URL(path);
    const search = parsedPath.search;
    return `${safeBaseUrl}${parsedPath.pathname}${search}`;
  }

  const parsedBaseUrl = new URL(serviceBaseUrl);

  let updatedBaseUrl = parsedBaseUrl.toString();
  if (updatedBaseUrl.endsWith("/")) {
    updatedBaseUrl = updatedBaseUrl.slice(0, -1);
  }
  if (path?.startsWith(updatedBaseUrl)) {
    return path;
  }

  const safePath = path?.startsWith("/") ? path : `/${path}`;
  return `${updatedBaseUrl}${safePath}`;
};

export function pathHasValidBaseUrl(path: string) {
  try {
    new URL(path);
    return true;
  } catch {
    return false;
  }
}

export function getPreferredAuthorizationId(
  authorizationId: null | string,
  authorizations: Array<Authorization>,
): string {
  // If the authorizationId is "none" or matches an id in the authorizations list, return it
  if (
    authorizationId === "none" ||
    (authorizationId &&
      authorizations.some((auth) => auth.id === authorizationId))
  ) {
    return authorizationId;
  }

  // Otherwise return the first authorization id in the list
  if (authorizations.length > 0) {
    return authorizations[0].id;
  }

  // If there are no authorizations, return "none"
  return "none";
}
