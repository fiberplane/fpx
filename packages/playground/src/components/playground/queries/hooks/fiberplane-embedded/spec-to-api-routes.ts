import {
  type SupportedDocument,
  type SupportedParameterObject,
  isSupportedParameterObject,
} from "@/lib/isOpenApi";
import type { ApiRoute } from "../../../types";
import { isValidMethod } from "./types";

export function specToApiRoutes(spec: SupportedDocument): {
  baseUrl: string;
  routes: ApiRoute[];
  tagOrder: string[];
} {
  const tagOrder = spec.tags?.map((tag) => tag.name) ?? [];
  const routes: ApiRoute[] = [];
  const baseUrl = spec.servers?.[0]?.url ?? window.location.origin;

  // Iterate through paths and methods to create ApiRoute objects
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem || {})) {
      const upperMethod = method.toUpperCase();
      if (
        isValidMethod(upperMethod) &&
        operation &&
        typeof operation !== "string" &&
        Array.isArray(operation) === false
      ) {
        // No items should be filtered out as we expect a dereferenced openapi object
        // The filtering is done to make clear that only supported parameter objects are allowed
        const parameters = pathItem?.parameters?.filter(
          isSupportedParameterObject,
        ) as Array<SupportedParameterObject> | undefined;
        routes.push({
          path,
          method: upperMethod,
          operation: operation,
          parameters,
        });
      }
    }
  }

  return {
    baseUrl,
    routes,
    tagOrder,
  };
}
