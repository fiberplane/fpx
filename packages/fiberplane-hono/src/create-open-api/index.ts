import type { Hono } from "hono";
import type { OpenAPIV3 } from "openapi-types";

/**
 * The OpenAPI specification type that only includes OpenAPI 3.0 documents
 * (excludes Swagger 2.0 documents which use 'swagger' instead of 'openapi')
 */
type OpenAPISpec = {
  openapi: string;
  info: OpenAPIV3.InfoObject;
  paths: OpenAPIV3.PathsObject;
  tags?: OpenAPIV3.TagObject[];
  servers?: OpenAPIV3.ServerObject[];
  components?: OpenAPIV3.ComponentsObject;
  security?: OpenAPIV3.SecurityRequirementObject[];
};

interface CreateOpenAPISpecOptions {
  info?: OpenAPIV3.InfoObject;
  tags?: OpenAPIV3.TagObject[];
  servers?: OpenAPIV3.ServerObject[];
  components?: OpenAPIV3.ComponentsObject;
  security?: OpenAPIV3.SecurityRequirementObject[];
}

type HttpMethod =
  | "get"
  | "put"
  | "post"
  | "delete"
  | "options"
  | "head"
  | "patch"
  | "trace";

/**
 * Create an OpenAPI specification for a Hono application
 * @param app - The Hono application to create the OpenAPI specification for
 * @param options - The options for the OpenAPI specification
 * @returns The OpenAPI specification
 * @example
 * ```ts
 * const app = new Hono();
 *
 * app.get("/", (c) => c.text("Hello, World!"));
 *
 * app.get("/openapi.json", (c) => {
 *   const spec = createOpenAPISpec(app, {
 *     info: { title: "My API", version: "1.0.0" },
 *   });
 *   return c.json(spec);
 * });
 * ```
 */
export function createOpenAPISpec(
  app: Hono,
  options: CreateOpenAPISpecOptions,
): OpenAPISpec {
  const routes = app.routes;
  const paths: OpenAPIV3.PathsObject = routes
    .filter(({ method }) => method.toLowerCase() !== "all")
    .reduce((paths, { path, method }) => {
      const methodLower = method.toLowerCase() as HttpMethod;

      // Convert Hono path params (e.g. /users/:id) to OpenAPI path params (e.g. /users/{id})
      // and extract the param names for documentation
      const { openApiPath, pathParams } = (
        path.match(/:([^/]+)/g) || []
      ).reduce(
        (acc, param) => ({
          openApiPath: acc.openApiPath.replace(param, `{${param.slice(1)}}`),
          pathParams: [...acc.pathParams, param.slice(1)],
        }),
        { openApiPath: path, pathParams: [] as string[] },
      );

      const operation: OpenAPIV3.OperationObject = {
        summary: `${method.toUpperCase()} ${openApiPath}`,
        ...(pathParams.length > 0 && {
          parameters: pathParams.map((param) => ({
            name: param,
            in: "path",
            required: true,
            schema: { type: "string" },
          })),
        }),
        responses: {
          "200": { description: "Successful operation" },
        },
      };

      // Create a new path object if it doesn't exist
      if (!paths[openApiPath]) {
        paths[openApiPath] = {} as OpenAPIV3.PathItemObject;
      }

      // Add the method operation to the path
      const pathItem = paths[openApiPath] as OpenAPIV3.PathItemObject;
      pathItem[methodLower] = operation;

      return paths;
    }, {} as OpenAPIV3.PathsObject);

  // Construct the final OpenAPI spec without spread operators
  const spec: OpenAPISpec = {
    openapi: "3.0.0",
    info: options.info ?? { title: "Hono API", version: "1.0.0" },
    paths,
  };

  if (options.tags) {
    spec.tags = options.tags;
  }
  if (options.servers) {
    spec.servers = options.servers;
  }
  if (options.components) {
    spec.components = options.components;
  }
  if (options.security) {
    spec.security = options.security;
  }

  return spec;
}
