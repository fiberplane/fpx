import PLACEGOOSE_API_SPEC from "@/lib/placegoose.json";
import { useQuery } from "@tanstack/react-query";
import { useStudioStore } from "../../store";
import type { ProbedRoute } from "../../types";

const PROBED_ROUTES_KEY = "probed-routes";

type ProbedRoutesResponse = {
  baseUrl: string;
  routes: ProbedRoute[];
};

type OpenAPIOperation = {
  summary?: string;
  description?: string;
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

function getOpenApiSpec(useMockApiSpec: boolean): OpenAPISpec {
  if (useMockApiSpec) {
    return PLACEGOOSE_API_SPEC as unknown as OpenAPISpec;
  }

  // Try to get the spec from the DOM
  const specElement = document.getElementById("fp-api-spec");
  if (!specElement?.textContent) {
    throw new Error(
      "No API spec found in DOM. Make sure there's a script element with id='fp-api-spec'",
    );
  }

  try {
    return JSON.parse(specElement.textContent) as OpenAPISpec;
  } catch (error) {
    console.error("Failed to parse API spec from DOM:", error);
    throw new Error(
      "Failed to parse API spec from DOM. Make sure it's valid JSON.",
    );
  }
}

function transformOpenApiToProbedRoutes(
  useMockApiSpec: boolean,
): ProbedRoutesResponse {
  const routes: ProbedRoute[] = [];
  let id = 1;

  const spec = getOpenApiSpec(useMockApiSpec);
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
          openApiSpec: operation ? JSON.stringify(operation) : undefined,
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
  const { useMockApiSpec } = useStudioStore("useMockApiSpec");

  return useQuery({
    queryKey: [PROBED_ROUTES_KEY, useMockApiSpec],
    queryFn: () => transformOpenApiToProbedRoutes(useMockApiSpec),
  });
}
