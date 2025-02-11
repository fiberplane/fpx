import { beforeEach, describe, expect, it, vi } from "vitest";
import logger from "../../logger/index.js";
import { getAllSettings } from "../settings/index.js";
import { fetchOpenApiSpec } from "./fetch.js";

// biome-ignore lint/suspicious/noExplicitAny: it's for the test
type Any = any;

// Mock the logger
vi.mock("../../logger/index.js", () => ({
  default: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the settings module
vi.mock("../settings/index.js", () => ({
  getAllSettings: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("fetchOpenApiSpec", () => {
  const mockDb = {
    // Mock minimal DB interface needed for tests
  } as Any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FPX_SERVICE_TARGET = undefined;
    // Reset the mock implementation
    (getAllSettings as Any).mockReset();
  });

  it("should return null when no spec URL is configured", async () => {
    // Mock getAllSettings to return no URL
    (getAllSettings as Any).mockResolvedValue({ openApiSpecUrl: undefined });

    const result = await fetchOpenApiSpec(mockDb, 0);
    expect(result).toBeNull();
  });

  it("should fetch and return OpenAPI spec from absolute URL", async () => {
    const mockSpec = { openapi: "3.0.0", paths: {} };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });

    // Mock getAllSettings to return an absolute URL
    (getAllSettings as Any).mockResolvedValue({
      openApiSpecUrl: "https://api.example.com/openapi.json",
    });

    const result = await fetchOpenApiSpec(mockDb, 0);
    expect(result).toEqual(mockSpec);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/openapi.json",
      {
        headers: { "x-fpx-ignore": "true" },
      },
    );
  });

  it("should handle relative URLs with FPX_SERVICE_TARGET", async () => {
    const mockSpec = { openapi: "3.0.0", paths: {} };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });

    process.env.FPX_SERVICE_TARGET = "http://localhost:3000";

    // Mock getAllSettings to return a relative URL
    (getAllSettings as Any).mockResolvedValue({
      openApiSpecUrl: "/api-docs/openapi.json",
    });

    const result = await fetchOpenApiSpec(mockDb, 0);
    expect(result).toEqual(mockSpec);
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3000/api-docs/openapi.json",
      {
        headers: { "x-fpx-ignore": "true" },
      },
    );
  });

  it("should return null when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    // Mock getAllSettings to return a URL
    (getAllSettings as Any).mockResolvedValue({
      openApiSpecUrl: "https://api.example.com/openapi.json",
    });

    const result = await fetchOpenApiSpec(mockDb, 0);
    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it("should return null when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
    });

    // Mock getAllSettings to return a URL
    (getAllSettings as Any).mockResolvedValue({
      openApiSpecUrl: "https://api.example.com/openapi.json",
    });

    const result = await fetchOpenApiSpec(mockDb, 0);
    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });
});
