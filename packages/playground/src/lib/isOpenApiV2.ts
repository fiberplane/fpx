import type { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from "openapi-types";

export function isOpenApiV3x(
  spec: OpenAPI.Document,
): spec is OpenAPIV3.Document | OpenAPIV3_1.Document {
  return (spec as OpenAPIV3.Document).openapi?.startsWith("3.");
}

export function isOpenApiV30(
  spec: OpenAPI.Document,
): spec is OpenAPIV3.Document {
  return (spec as OpenAPIV3.Document).openapi?.startsWith("3.0");
}

export function isOpenApiV31(
  spec: OpenAPI.Document,
): spec is OpenAPIV3_1.Document {
  return (spec as OpenAPIV3_1.Document).openapi?.startsWith("3.1");
}

export function isOpenApiV2(
  spec: OpenAPI.Document,
): spec is OpenAPIV2.Document {
  return (spec as OpenAPIV2.Document).swagger?.startsWith("2.");
}
