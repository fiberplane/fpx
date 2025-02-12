import type { OpenAPIOperation, OpenApiSpec } from "./types.js";

type PathMapping = {
  honoPath: string;
  method: string;
  operation: OpenAPIOperation;
};

/**
 * Correlate Hono routes to OpenAPI paths.
 */
export function mapOpenApiToHonoRoutes(
  openApiSpec: OpenApiSpec,
): PathMapping[] {
  const pathMappings: PathMapping[] = [];

  for (const [openApiPath, methods] of Object.entries(openApiSpec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      // Convert OpenAPI path parameters {param} to Hono format :param
      const honoPath = openApiPath.replace(/{(\w+)}/g, ":$1");

      pathMappings.push({
        honoPath,
        method: method.toUpperCase(),
        operation,
      });
    }
  }

  return pathMappings;
}
