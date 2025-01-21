// import PLACEGOOSE_API_SPEC from "@/lib/placegoose.json";
import TIGHTKNIT_API_SPEC from "@/lib/tightknit.json";

import type { OpenAPIComponents } from "@fiberplane/fpx-types";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
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
  components: OpenAPIComponents;
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

type ResolvedSpecResult =
  | {
      type: "success";
      spec: OpenAPISpec;
    }
  | {
      type: "error";
      error: string;
      source: string;
      retryable: boolean;
      attemptedUrl?: string;
    }
  | {
      type: "empty";
    };

function getOpenApiSpec(useMockApiSpec: boolean): ResolvedSpecResult {
  if (useMockApiSpec) {
    return {
      type: "success",
      spec: TIGHTKNIT_API_SPEC as unknown as OpenAPISpec,
    };
  }

  // Try to get the spec from the DOM
  const specElement = document.getElementById("fp-api-spec");
  const errorElement = document.getElementById("fp-api-spec-error");

  // If we have an error element, parse it to get error details
  if (errorElement?.textContent) {
    try {
      const errorResult = JSON.parse(
        errorElement.textContent,
      ) as ResolvedSpecResult;
      if (errorResult.type === "error") {
        return errorResult;
      }
    } catch {
      // If we can't parse the error, fall through to try the spec
    }
  }

  // If we have a spec element, try to parse it
  if (specElement?.textContent) {
    try {
      const spec = JSON.parse(specElement.textContent) as OpenAPISpec;
      return { type: "success", spec };
    } catch (error) {
      return {
        type: "error",
        error: "Failed to parse API spec from DOM",
        source: "dom",
        retryable: false,
      };
    }
  }

  // If we have neither element, return empty
  return { type: "empty" };
}

async function transformOpenApiToProbedRoutes(
  useMockApiSpec: boolean,
): Promise<ProbedRoutesResponse> {
  // This is the generated ID for the converted routes
  let id = 1;
  const generateId = () => id++;

  const result = getOpenApiSpec(useMockApiSpec);
  if (result.type === "error") {
    if (result.retryable && result.attemptedUrl) {
      console.log(
        "Fetching the spec failed on the server, let's retry here",
        result.attemptedUrl,
      );
      const spec = await fetch(result.attemptedUrl).then((res) => res.json());
      return parseThatSpec(spec, generateId);
    }

    console.warn(
      "Fetching the spec failed on the server, and the error is not retryable",
      result,
    );

    throw new Error(result.error);
  }

  if (result.type === "empty") {
    return {
      baseUrl: window.location.origin,
      routes: [],
    };
  }

  return parseThatSpec(result.spec, generateId);
}

function parseThatSpec(
  spec: OpenAPISpec,
  generateId: () => number,
): {
  baseUrl: string;
  routes: ProbedRoute[];
} {
  const routes: ProbedRoute[] = [];
  const baseUrl = spec.servers?.[0]?.url ?? window.location.origin;

  // Iterate through paths and methods to create ProbedRoute objects
  for (const [path, pathItem] of Object.entries(spec.paths)) {
    // Convert {param} to :param in path
    const transformedPath = path.replace(/\{([^}]+)\}/g, ":$1");

    for (const [method, operation] of Object.entries(pathItem)) {
      const upperMethod = method.toUpperCase();
      if (isValidMethod(upperMethod)) {
        const id = generateId();
        const dereferencedOperation = dereferenceSchema<OpenAPIOperation>(
          operation,
          spec.components ?? {},
          new Set(),
          new Map(),
        );
        routes.push({
          id,
          path: transformedPath,
          method: upperMethod,
          requestType: "http",
          handler: "",
          handlerType: "route",
          currentlyRegistered: true,
          registrationOrder: id,
          routeOrigin: "discovered",
          isDraft: false,
          openApiSpec: operation
            ? JSON.stringify(dereferencedOperation)
            : undefined,
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

export const RefCacheSchema = z.map(z.string(), z.unknown());
export type RefCache = z.infer<typeof RefCacheSchema>;

export class CircularReferenceError extends Error {
  constructor(ref: string) {
    super(`Circular reference detected: ${ref}`);
    this.name = "CircularReferenceError";
  }
}

export class MissingReferenceError extends Error {
  constructor(ref: string) {
    super(`Reference not found: ${ref}`);
    this.name = "MissingReferenceError";
  }
}

/**
 * Resolves a reference string to its corresponding object in the OpenAPI components.
 *
 * @param ref - The reference string to resolve (e.g., "#/components/schemas/Pet")
 * @param components - The OpenAPI components object containing all definitions
 * @param refStack - Set to track reference paths for circular reference detection
 * @param cache - Map to cache resolved references for better performance
 * @returns The resolved object from the components
 * @throws {CircularReferenceError} When a circular reference is detected
 * @throws {MissingReferenceError} When the referenced object cannot be found
 */
export function resolveRef(
  ref: string,
  components: OpenAPIComponents,
  refStack: Set<string> = new Set(),
  cache: RefCache = new Map(),
): unknown {
  // Check cache first
  const cached = cache.get(ref);
  if (cached) {
    return cached;
  }

  // Check for circular references
  if (refStack.has(ref)) {
    throw new CircularReferenceError(ref);
  }
  refStack.add(ref);

  const path = ref.replace("#/components/", "").split("/");
  // TODO - The `unknown` type is to avoid writing our own types for openapi schemas for now
  const resolved = path.reduce<Record<string, unknown>>(
    (acc, part) => {
      if (!acc || typeof acc !== "object") {
        throw new MissingReferenceError(ref);
      }
      const value = (acc as Record<string, unknown>)[part];
      return value as Record<string, unknown>;
    },
    components as unknown as Record<string, unknown>,
  );

  if (!resolved) {
    throw new MissingReferenceError(ref);
  }

  // If the resolved value contains another reference, resolve it
  if (typeof resolved === "object" && resolved !== null && "$ref" in resolved) {
    const nestedRef = resolved.$ref as string;
    return resolveRef(nestedRef, components, refStack, cache);
  }

  // Cache the result
  cache.set(ref, resolved);
  refStack.delete(ref);

  return resolved;
}

/**
 * Dereferences all $ref properties in an OpenAPI schema object, replacing them with their actual values.
 * Handles nested objects and arrays recursively.
 *
 * @param obj - The object to dereference, as of writing this is an OpenAPI operation
 * @param components - The OpenAPI components object containing all definitions
 * @param refStack - Set to track reference paths for circular reference detection
 * @param cache - Map to cache resolved references for better performance
 * @returns A new object with all references resolved
 * @template T - The type of the input object
 */
export function dereferenceSchema<T extends { [key: string]: unknown }>(
  obj: T,
  components: OpenAPIComponents,
  refStack: Set<string> = new Set(),
  cache: RefCache = new Map(),
): T {
  // Deep clone the object to avoid modifying the original
  const cloned = JSON.parse(JSON.stringify(obj)) as T;

  if (!cloned || typeof cloned !== "object") {
    return cloned;
  }

  if ("$ref" in cloned && typeof cloned.$ref === "string") {
    return resolveRef(cloned.$ref, components, refStack, cache) as T;
  }

  return Object.entries(cloned).reduce<T>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key as keyof T] = value.map((item) =>
        dereferenceSchema(
          item as Record<string, unknown>,
          components,
          refStack,
          cache,
        ),
      ) as T[keyof T];
    } else if (typeof value === "object" && value !== null) {
      acc[key as keyof T] = dereferenceSchema(
        value as Record<string, unknown>,
        components,
        refStack,
        cache,
      ) as T[keyof T];
    } else {
      acc[key as keyof T] = value as T[keyof T];
    }
    return acc;
  }, {} as T);
}
