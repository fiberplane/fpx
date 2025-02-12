import { isOpenApiV2 } from "@/lib/isOpenApi";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIV3 } from "openapi-types";
import { specToApiRoutes } from "./spec-to-api-routes";
import type { ApiRoutesResponse, ResolvedDocumentResult } from "./types";
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
  const result = await getOpenApiSpec(openapi);

  if (result.type === "empty") {
    return {
      baseUrl: window.location.origin,
      routes: [],
      tagOrder: [],
    };
  }

  if (result.type === "error") {
    return handleSpecError(result);
  }

  return specToApiRoutes(result.value);
}

async function parseSpec(spec: unknown) {
  const parser = new SwaggerParser();

  const result = await parser.dereference(spec as OpenAPIV3.Document);

  if (!result) {
    throw new Error("Unexpected result parsing OpenAPI spec file");
  }

  if (!result || isOpenApiV2(result)) {
    throw new Error(
      "Unsupported OpenAPI v2 (swagger) is not supported. Please update the spec file",
    );
  }

  return result;
}
/**
 * Attempts to get the OpenAPI spec either from a mock spec or from the route context.
 * Returns empty if no spec is found.
 */
async function getOpenApiSpec(
  content: string,
): Promise<ResolvedDocumentResult> {
  if (!content) {
    return { type: "empty" };
  }

  try {
    const result = await parseSpec(
      typeof content === "string" ? JSON.parse(content) : content,
    );

    return { type: "success", value: result };
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
  result: ResolvedDocumentResult & { type: "error" },
): Promise<ApiRoutesResponse> {
  if (result.retryable && result.attemptedUrl) {
    console.log(
      "Fetching the spec failed on the server, let's retry here",
      result.attemptedUrl,
    );
    try {
      const spec = await fetch(result.attemptedUrl).then((res) => res.json());
      return specToApiRoutes(spec);
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
