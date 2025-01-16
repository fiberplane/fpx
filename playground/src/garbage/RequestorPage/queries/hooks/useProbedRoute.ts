import PLACEGOOSE_API_SPEC from "@/lib/placegoose.json";
import { useQuery } from "@tanstack/react-query";
import type { ProbedRoute } from "../../types";

const PROBED_ROUTES_KEY = "probed-routes";

type ProbedRoutesResponse = {
  baseUrl: string;
  routes: ProbedRoute[];
};

type OpenAPIOperation = {
  summary: string;
  description: string;
  parameters?: Array<{
    name: string;
    in: string;
    required: boolean;
    schema: {
      type: string;
      format?: string;
    };
  }>;
  responses: Record<string, unknown>;
};

type OpenAPIPathItem = {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  head?: OpenAPIOperation;
};

type OpenAPISpec = {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers?: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, OpenAPIPathItem>;
};

const VALID_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
  "HEAD",
] as const;
type ValidMethod = (typeof VALID_METHODS)[number];

function isValidMethod(method: string): method is ValidMethod {
  return VALID_METHODS.includes(method.toUpperCase() as ValidMethod);
}

function transformOpenApiToProbedRoutes(): ProbedRoutesResponse {
  const routes: ProbedRoute[] = [];
  let id = 1;

  const spec = PLACEGOOSE_API_SPEC as OpenAPISpec;
  const baseUrl = spec.servers?.[0]?.url ?? "http://localhost:8787";

  // Iterate through paths and methods to create ProbedRoute objects
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    // Convert {param} to :param in path
    const transformedPath = path.replace(/\{([^}]+)\}/g, ":$1");

    for (const [method, operation] of Object.entries(pathItem)) {
      const upperMethod = method.toUpperCase();
      if (isValidMethod(upperMethod)) {
        routes.push({
          id: id++,
          path: transformedPath,
          method: upperMethod,
          requestType: "http",
          handler: "",
          handlerType: "route",
          currentlyRegistered: true,
          registrationOrder: id,
          routeOrigin: "discovered",
          isDraft: false,
        });
      }
    }
  }

  return {
    baseUrl,
    routes,
  };
}

export function useProbedRoutes() {
  return useQuery({
    queryKey: [PROBED_ROUTES_KEY],
    queryFn: transformOpenApiToProbedRoutes,
  });
}
