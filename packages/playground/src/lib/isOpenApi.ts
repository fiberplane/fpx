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
export type SupportedDocument = OpenAPIV3.Document | OpenAPIV3_1.Document;

export type SupportedReferenceObject =
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3_1.ReferenceObject;

export type SupportedParameterObject =
  | OpenAPIV3.ParameterObject
  | OpenAPIV3_1.ParameterObject;

export function isSupportedParameterObject(
  value: SupportedReferenceObject | SupportedParameterObject,
): value is SupportedParameterObject {
  return "name" in value;
}

export type SupportedOperationObject =
  | OpenAPIV3.OperationObject
  | OpenAPIV3_1.OperationObject;

export function isSupportedOperationObject(
  value: SupportedOperationObject | SupportedReferenceObject,
): value is SupportedOperationObject {
  // If it's not a reference object, then it must be an OperationObject!
  return "$ref" in value === false;
}

export type SupportedRequestBodyObject =
  | OpenAPIV3.RequestBodyObject
  | OpenAPIV3_1.RequestBodyObject;

export function isSupportedRequestBodyObject(
  value: SupportedRequestBodyObject | SupportedReferenceObject,
): value is SupportedRequestBodyObject {
  return "content" in value;
}
export type SupportedResponseObject =
  | OpenAPIV3.ResponseObject
  | OpenAPIV3_1.ResponseObject;

export type SupportedSchemaObject =
  | OpenAPIV3.SchemaObject
  | OpenAPIV3_1.SchemaObject;

export function isSupportedSchemaObject(
  value: SupportedReferenceObject | SupportedSchemaObject,
): value is SupportedSchemaObject {
  // If it's not a reference object, then it must be "the other thing" (supported schema object)
  return "$ref" in value === false;
}

export type SupportedMediaTypeObject =
  | OpenAPIV3.MediaTypeObject
  | OpenAPIV3_1.MediaTypeObject;
