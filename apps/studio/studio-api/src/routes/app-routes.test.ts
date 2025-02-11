import { generateOtelTraceId, isValidOtelTraceId } from "../lib/otel/index.js";
import { ProxyRequestHeadersSchema } from "./app-routes.js";

describe("ProxyRequestHeadersSchema", () => {
  it("should validate and pass through a valid otel trace id in the fpx-trace-id header", () => {
    const traceId = generateOtelTraceId();
    const result = ProxyRequestHeadersSchema.safeParse({
      "x-fpx-trace-id": traceId,
      "x-fpx-proxy-to": "https://example.com",
      "x-fpx-path-params": "{}",
      "x-fpx-route": "/users/:id",
    });
    expect(result.success).toBe(true);
    expect(result.data?.["x-fpx-trace-id"]).toBe(traceId);
  });

  it("should fall back to a generated trace id if the fpx-trace-id header is not present", () => {
    const result = ProxyRequestHeadersSchema.safeParse({
      "x-fpx-proxy-to": "https://example.com",
      "x-fpx-path-params": "{}",
      "x-fpx-route": "/users/:id",
    });
    expect(result.success).toBe(true);
    expect(result.data?.["x-fpx-trace-id"]).toBeDefined();
    expect(isValidOtelTraceId(result.data?.["x-fpx-trace-id"] ?? "")).toBe(
      true,
    );
  });

  it("should fall back to a generated trace id if the fpx-trace-id header is invalid", () => {
    const result = ProxyRequestHeadersSchema.safeParse({
      "x-fpx-proxy-to": "https://example.com",
      "x-fpx-path-params": "{}",
      "x-fpx-route": "/users/:id",
      "x-fpx-trace-id": "invalid",
    });
    expect(result.success).toBe(true);
    expect(result.data?.["x-fpx-trace-id"]).toBeDefined();
    expect(isValidOtelTraceId(result.data?.["x-fpx-trace-id"] ?? "")).toBe(
      true,
    );
  });

  it("should fall back to distinct otel trace ids for each request, not the same one each time", () => {
    const result1 = ProxyRequestHeadersSchema.safeParse({
      "x-fpx-proxy-to": "https://example.com",
      "x-fpx-path-params": "{}",
      "x-fpx-route": "/users/:id",
      "x-fpx-trace-id": "invalid1",
    });
    expect(result1.success).toBe(true);
    expect(result1.data?.["x-fpx-trace-id"]).toBeDefined();

    const result2 = ProxyRequestHeadersSchema.safeParse({
      "x-fpx-proxy-to": "https://example.com",
      "x-fpx-path-params": "{}",
      "x-fpx-route": "/users/:id",
      "x-fpx-trace-id": "invalid2",
    });
    expect(result2.success).toBe(true);
    expect(result2.data?.["x-fpx-trace-id"]).toBeDefined();

    // Check that the trace ids are different
    expect(result1.data?.["x-fpx-trace-id"]).not.toEqual(
      result2.data?.["x-fpx-trace-id"],
    );
  });

  it("should fail when the proxy-to header is not present", () => {
    const result = ProxyRequestHeadersSchema.safeParse({
      "x-fpx-path-params": "{}",
      "x-fpx-route": "/users/:id",
    });
    expect(result.success).toBe(false);
  });
});
