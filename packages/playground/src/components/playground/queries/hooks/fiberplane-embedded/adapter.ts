import { specToApiRoutes } from "./spec-to-api-routes";
import type { ApiRoutesResponse, OpenAPISpec } from "./types";
import type { ResolvedSpecResult } from "./types";

/**
 * Adapter module for converting OpenAPI specs into ApiRoutesResponse format.
 *
 * Handles fetching specs from either mock data or DOM elements, parsing them,
 * and transforming them into a standardized route format for the playground.
 * Includes error handling (with retry) for spec parsing failures.
 *
 * The spec is assumed to be serialized into the DOM by the fiberplane Hono embeddable playground middleware
 * `@fiberplane/hono`
 */
export async function getApiRoutesFromOpenApiSpec(
  openapi: string,
): Promise<ApiRoutesResponse> {
  // This is the generated ID for the converted routes
  let id = 1;
  const generateId = () => id++;

  const result = getOpenApiSpec(openapi);

  if (result.type === "empty") {
    return {
      baseUrl: window.location.origin,
      routes: [],
      tagOrder: [],
    };
  }

  if (result.type === "error") {
    return handleSpecError(result, generateId);
  }

  return specToApiRoutes(result.spec, generateId);
}

/**
 * Attempts to get the OpenAPI spec either from a mock spec or from the route context.
 * Returns empty if no spec is found.
 */
function getOpenApiSpec(openapi: string): ResolvedSpecResult {
  if (!openapi) {
    return { type: "empty" };
  }

  try {
    const spec = JSON.parse(openapi) as OpenAPISpec;
    return { type: "success", spec };
  } catch (error) {
    return {
      type: "error",
      error: "Failed to parse API spec from route context",
      source: "context",
      retryable: false,
    };
  }
}

async function handleSpecError(
  result: ResolvedSpecResult & { type: "error" },
  generateId: () => number,
): Promise<ApiRoutesResponse> {
  if (result.retryable && result.attemptedUrl) {
    console.log(
      "Fetching the spec failed on the server, let's retry here",
      result.attemptedUrl,
    );
    try {
      const spec = await fetch(result.attemptedUrl).then((res) => res.json());
      return specToApiRoutes(spec, generateId);
    } catch (_err) {
      console.warn(
        "Fetching the spec failed on the server, and the retry failed",
        result,
      );
    }
  } else {
    console.warn(
      "Fetching the spec failed on the server, and the error is not retryable",
      result,
    );
  }

  window.alert("Fetching the OpenAPI spec failed!");
  throw new Error(result.error);
}
