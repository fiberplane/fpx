import { z } from "zod";
import {
  type KeyValueParameter,
  enforceTerminalDraftParameter,
} from "../KeyValueForm";
import type { findMatchedRoute } from "../routes";
import type { ProbedRoute } from "../types";
import { type RequestMethod, type RequestType, isWsRequest } from "../types";
import type { RequestorState } from "./types";

export const _getActiveRoute = (state: RequestorState): ProbedRoute => {
  return (
    state.activeRoute ?? {
      path: state.path,
      method: state.method,
      requestType: state.requestType,
      handler: "",
      handlerType: "route",
      currentlyRegistered: false,
      registrationOrder: -1,
      routeOrigin: "custom",
      isDraft: true,
    }
  );
};

// Not in use
export const routeEquality = (a: ProbedRoute, b: ProbedRoute): boolean => {
  return (
    a.path === b.path &&
    a.method === b.method &&
    a.routeOrigin === b.routeOrigin &&
    a.requestType === b.requestType
  );
};

export function probedRouteToInputMethod(route: ProbedRoute): RequestMethod {
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
    default:
      return "GET";
  }
}

export function filterDisabledEmptyQueryParams(
  currentQueryParams: KeyValueParameter[],
) {
  return enforceTerminalDraftParameter(
    currentQueryParams.filter((param) => param.enabled || !!param.value),
  );
}

export function extractQueryParamsFromOpenApiDefinition(
  currentQueryParams: KeyValueParameter[],
  route: ProbedRoute,
) {
  if (!route.openApiSpec) {
    return enforceTerminalDraftParameter(currentQueryParams);
  }

  const parsedSpec = safeParseOpenApiSpec(route.openApiSpec, route.path);
  if (!parsedSpec) {
    return enforceTerminalDraftParameter(currentQueryParams);
  }

  // Extract query parameters from OpenAPI spec
  const specQueryParams =
    parsedSpec.parameters?.filter((param) => param.in === "query") ?? [];

  // Convert OpenAPI params to KeyValueParameter format
  const openApiQueryParams: KeyValueParameter[] = specQueryParams.map(
    (param) => ({
      id: param.name,
      key: param.name,
      value: param.schema.example?.toString() ?? "",
      enabled: param.required,
    }),
  );

  // Merge with existing parameters, preferring existing values
  const mergedParams = openApiQueryParams.map((openApiParam) => {
    const existingParam = currentQueryParams.find(
      (p) => p.key === openApiParam.key,
    );
    return existingParam ?? openApiParam;
  });

  // Add any existing parameters that weren't in the OpenAPI spec
  const additionalParams = currentQueryParams.filter(
    (param) => !openApiQueryParams.some((p) => p.key === param.key),
  );

  return enforceTerminalDraftParameter([...mergedParams, ...additionalParams]);
}

const OpenApiParameterSchema = z.object({
  parameters: z
    .array(
      z.object({
        schema: z.object({
          type: z.string(),
          example: z.any().optional(),
        }),
        required: z.boolean(),
        name: z.string(),
        in: z.enum(["path", "query", "header", "cookie"]),
      }),
    )
    .optional(),
  requestBody: z
    .object({
      content: z.object({
        "application/json": z.object({
          schema: z.object({
            $ref: z.string().startsWith("#/components/schemas/"),
          }),
        }),
      }),
    })
    .optional(),
  responses: z.record(z.string(), z.any()).optional(), // We don't validate responses structure since we only care about parameters
});

function safeParseOpenApiSpec(openApiSpec: string, routePath: string) {
  try {
    const spec = JSON.parse(openApiSpec);
    const parsedSpec = OpenApiParameterSchema.safeParse(spec);
    if (!parsedSpec.success) {
      console.warn(
        `Data in openApiSpec for ${routePath} was not in expected format. Here is the error: ${parsedSpec.error?.format?.()}`,
      );
      return null;
    }
    return parsedSpec.data;
  } catch {
    return null;
  }
}

/**
 * Extracts path parameters from a path
 *
 * @TODO - Rewrite to use Hono router
 *
 * @param path
 * @returns
 */
export function extractPathParams(path: string) {
  const regex = /\/(:[a-zA-Z0-9_-]+)/g;

  const result: Array<string> = [];
  // let match = regex.exec(path);
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

    // HACK - Remove the `:` at the beginning of the match, to make things consistent with Hono router path param matching
    const keyWithoutColon = match[1].slice(1);
    result.push(keyWithoutColon);
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
    const nextValue = value === `:${key}` ? "" : value;
    return {
      ...mapPathParamKey(key),
      value: nextValue,
      enabled: !!nextValue,
    };
  });
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

export const addBaseUrl = (
  serviceBaseUrl: string,
  path: string,
  {
    requestType,
    forceChangeHost,
  }: { requestType?: RequestType; forceChangeHost?: boolean } = {
    requestType: "http",
    forceChangeHost: false,
  },
) => {
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
  if (requestType && isWsRequest(requestType)) {
    parsedBaseUrl.protocol = "ws";
  }
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
