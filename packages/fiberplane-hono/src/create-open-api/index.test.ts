import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import { createOpenAPISpec } from "./index.js";
import type { OpenAPIV3 } from "openapi-types";

describe("createOpenAPISpec", () => {
  it("should generate basic OpenAPI spec for simple routes", () => {
    const app = new Hono();
    app.get("/hello", (c) => c.text("Hello"));
    app.post("/users", (c) => c.text("Create user"));

    const spec = createOpenAPISpec(app, {
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      tags: [],
      servers: [],
      components: {},
      security: [],
    });

    expect(spec.openapi).toBe("3.0.0");
    expect(spec.info.title).toBe("Test API");
    expect(spec.info.version).toBe("1.0.0");
    
    const paths = spec.paths as OpenAPIV3.PathsObject;
    expect(paths).toHaveProperty("/hello");
    expect(paths).toHaveProperty("/users");
    expect(paths["/hello"]?.get).toBeDefined();
    expect(paths["/users"]?.post).toBeDefined();
  });

  it("should handle path parameters correctly", () => {
    const app = new Hono();
    app.get("/users/:userId", (c) => c.text("Get user"));
    app.put("/users/:userId/posts/:postId", (c) => c.text("Update post"));

    const spec = createOpenAPISpec(app, {
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      tags: [],
      servers: [],
      components: {},
      security: [],
    });

    const paths = spec.paths as OpenAPIV3.PathsObject;
    expect(paths).toHaveProperty("/users/{userId}");
    expect(paths).toHaveProperty("/users/{userId}/posts/{postId}");

    const userRoute = paths["/users/{userId}"]?.get;
    expect(userRoute?.parameters).toHaveLength(1);
    expect(userRoute?.parameters?.[0]).toEqual({
      name: "userId",
      in: "path",
      required: true,
      schema: { type: "string" },
    });

    const postRoute = paths["/users/{userId}/posts/{postId}"]?.put;
    expect(postRoute?.parameters).toHaveLength(2);
    expect(postRoute?.parameters).toEqual([
      {
        name: "userId",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
      {
        name: "postId",
        in: "path",
        required: true,
        schema: { type: "string" },
      },
    ]);
  });

  it("should skip 'all' method routes", () => {
    const app = new Hono();
    app.all("/wildcard", (c) => c.text("Wildcard"));
    app.get("/normal", (c) => c.text("Normal"));

    const spec = createOpenAPISpec(app, {
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      tags: [],
      servers: [],
      components: {},
      security: [],
    });

    const paths = spec.paths as OpenAPIV3.PathsObject;
    expect(paths).not.toHaveProperty("/wildcard");
    expect(paths).toHaveProperty("/normal");
  });

  it("should handle multiple methods for the same path", () => {
    const app = new Hono();
    app.get("/resource", (c) => c.text("Get resource"));
    app.post("/resource", (c) => c.text("Create resource"));
    app.put("/resource", (c) => c.text("Update resource"));
    app.delete("/resource", (c) => c.text("Delete resource"));

    const spec = createOpenAPISpec(app, {
      info: {
        title: "Test API",
        version: "1.0.0",
      },
      tags: [],
      servers: [],
      components: {},
      security: [],
    });

    const paths = spec.paths as OpenAPIV3.PathsObject;
    expect(paths["/resource"]).toHaveProperty("get");
    expect(paths["/resource"]).toHaveProperty("post");
    expect(paths["/resource"]).toHaveProperty("put");
    expect(paths["/resource"]).toHaveProperty("delete");

    const methods = paths["/resource"];
    Object.entries(methods || {}).forEach(([method, operation]) => {
      const op = operation as OpenAPIV3.OperationObject;
      expect(op.responses).toHaveProperty("200");
      const response = op.responses["200"] as OpenAPIV3.ResponseObject;
      expect(response.description).toBe("Successful operation");
    });
  });
});
