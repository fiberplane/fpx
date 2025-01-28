import type { ProbedRoute } from "../../../types";
import { dereferenceSchema } from "./dereference-schema";
import { isValidMethod } from "./types";
import type { OpenAPIOperation, OpenAPISpec } from "./types";

export function specToProbedRoutes(
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
