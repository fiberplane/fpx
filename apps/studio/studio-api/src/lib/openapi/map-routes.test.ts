import { mapOpenApiToHonoRoutes } from "./map-routes.js";
import type { OpenAPIOperation, OpenApiSpec } from "./types.js";

describe("mapOpenApiToHonoRoutes", () => {
  it("should convert OpenAPI paths to Hono paths", () => {
    const mockSpec: OpenApiSpec = {
      paths: {
        "/users/{id}": {
          get: { operationId: "getUser" } as unknown as OpenAPIOperation,
          put: { operationId: "updateUser" } as unknown as OpenAPIOperation,
        },
        "/posts/{postId}/comments/{commentId}": {
          get: { operationId: "getComment" } as unknown as OpenAPIOperation,
        },
        "/simple/path": {
          post: {
            operationId: "createSomething",
          } as unknown as OpenAPIOperation,
        },
      },
    };

    const result = mapOpenApiToHonoRoutes(mockSpec);

    expect(result).toEqual([
      {
        honoPath: "/users/:id",
        method: "GET",
        operation: { operationId: "getUser" },
      },
      {
        honoPath: "/users/:id",
        method: "PUT",
        operation: { operationId: "updateUser" },
      },
      {
        honoPath: "/posts/:postId/comments/:commentId",
        method: "GET",
        operation: { operationId: "getComment" },
      },
      {
        honoPath: "/simple/path",
        method: "POST",
        operation: { operationId: "createSomething" },
      },
    ]);
  });

  it("should handle empty paths object", () => {
    const mockSpec: OpenApiSpec = {
      paths: {},
    };

    const result = mapOpenApiToHonoRoutes(mockSpec);

    expect(result).toEqual([]);
  });
});
