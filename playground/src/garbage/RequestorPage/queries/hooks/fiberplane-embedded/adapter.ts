import PLACEGOOSE_API_SPEC from "@/lib/placegoose.json";
import TIGHTKNIT_API_SPEC from "@/lib/tightknit.json";

import { specToProbedRoutes } from "./spec-to-probed-routes";
import type { OpenAPISpec, ProbedRoutesResponse } from "./types";
import type { ResolvedSpecResult } from "./types";

const MOCK_API_SPEC =
  process.env.NODE_ENV === "production"
    ? PLACEGOOSE_API_SPEC // Render placegoose as mock api spec in production
    : TIGHTKNIT_API_SPEC; // Render tightknit as mock api spec in development

/**
 * Adapter module for converting OpenAPI specs into ProbedRoutesResponse format.
 *
 * Handles fetching specs from either mock data or DOM elements, parsing them,
 * and transforming them into a standardized route format for the playground.
 * Includes error handling (with retry) for spec parsing failures.
 *
 * The spec is assumed to be serialized into the DOM by the fiberplane Hono embeddable playground middleware
 * `@fiberplane/embedded`
 */
export async function getProbedRoutesFromOpenApiSpec(
  useMockApiSpec: boolean,
): Promise<ProbedRoutesResponse> {
  // This is the generated ID for the converted routes
  let id = 1;
  const generateId = () => id++;

  const result = getOpenApiSpec(useMockApiSpec);

  if (result.type === "empty") {
    return {
      baseUrl: window.location.origin,
      routes: [],
    };
  }

  if (result.type === "error") {
    return handleSpecError(result, generateId);
  }

  return specToProbedRoutes(result.spec, generateId);
}

/**
 * Attempts to get the OpenAPI spec either from a mock spec or from the DOM. If getting from the DOM,
 * looks for a spec element and error element, parses them, and returns the appropriate result.
 * Returns empty if no spec is found.
 */
function getOpenApiSpec(useMockApiSpec: boolean): ResolvedSpecResult {
  if (useMockApiSpec) {
    return {
      type: "success",
      spec: MOCK_API_SPEC as unknown as OpenAPISpec,
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

async function handleSpecError(
  result: ResolvedSpecResult & { type: "error" },
  generateId: () => number,
): Promise<ProbedRoutesResponse> {
  if (result.retryable && result.attemptedUrl) {
    console.log(
      "Fetching the spec failed on the server, let's retry here",
      result.attemptedUrl,
    );
    try {
      const spec = await fetch(result.attemptedUrl).then((res) => res.json());
      return specToProbedRoutes(spec, generateId);
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
