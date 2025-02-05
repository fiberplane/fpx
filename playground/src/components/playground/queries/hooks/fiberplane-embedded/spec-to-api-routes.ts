import type { ApiRoute } from "../../../types";
import { dereferenceSchema } from "./dereference-schema";
import { isValidMethod } from "./types";
import type { OpenAPIOperation, OpenAPISpec } from "./types";

export function specToApiRoutes(
  spec: OpenAPISpec,
  generateId: () => number,
): {
  baseUrl: string;
  routes: ApiRoute[];
} {
  const routes: ApiRoute[] = [];
  const baseUrl = spec.servers?.[0]?.url ?? window.location.origin;

  // Iterate through paths and methods to create ApiRoute objects
  for (const [path, pathItem] of Object.entries(spec.paths)) {
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
          path,
          method: upperMethod,
          // `summary` is the succint title of the operation
          summary: dereferencedOperation.summary,
          // `description` is the more long-form description of the operation
          description: dereferencedOperation.description,
          // TODO - Dereference tags? (Make sure they're in the Schema)
          tags: dereferencedOperation.tags,
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
