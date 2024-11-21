import type { OpenAPIComponents, RefCache } from "./types.js";

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
