import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FpxLogger } from "./logger";
import type { PromiseStore } from "./promiseStore";
import {
  isRouteInspectorRequest,
  respondWithRoutes,
  sendRoutes,
} from "./routes";
import type { HonoLikeApp, HonoLikeFetch } from "./types";

describe("routes", () => {
  describe("isRouteInspectorRequest", () => {
    it("should return true when X-Fpx-Route-Inspector header is present", () => {
      const request = new Request("https://example.com", {
        headers: { "X-Fpx-Route-Inspector": "true" },
      });
      expect(isRouteInspectorRequest(request)).toBe(true);
    });

    it("should return false when X-Fpx-Route-Inspector header is not present", () => {
      const request = new Request("https://example.com");
      expect(isRouteInspectorRequest(request)).toBe(false);
    });
  });

  describe("sendRoutes", () => {
    let mockFetch: ReturnType<typeof vi.fn<[HonoLikeFetch], unknown>>;
    let mockApp: HonoLikeApp;
    let mockLogger: FpxLogger;
    let mockPromiseStore: PromiseStore;

    beforeEach(() => {
      mockFetch = vi.fn().mockResolvedValue(new Response("OK"));
      mockApp = {
        routes: [{ method: "GET", path: "/test", handler: () => {} }],
        fetch: vi.fn(),
      } as unknown as HonoLikeApp;
      mockLogger = { debug: vi.fn() } as unknown as FpxLogger;
      mockPromiseStore = { add: vi.fn() } as unknown as PromiseStore;
    });

    it("should send routes successfully", async () => {
      const result = await sendRoutes(
        mockFetch as unknown as typeof fetch,
        "https://fpx.example.com",
        mockApp,
        mockLogger,
      );
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://fpx.example.com/v0/probed-routes",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: expect.any(String),
        }),
      );
    });

    it("should use promiseStore when provided", async () => {
      await sendRoutes(
        mockFetch as unknown as typeof fetch,
        "https://fpx.example.com",
        mockApp,
        mockLogger,
        mockPromiseStore,
      );
      expect(mockPromiseStore.add).toHaveBeenCalled();
    });

    it("should return false and log error on failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const result = await sendRoutes(
        mockFetch as unknown as typeof fetch,
        "https://fpx.example.com",
        mockApp,
        mockLogger,
      );
      expect(result).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Error sending routes to FPX:",
        "Network error",
      );
    });
  });

  describe("respondWithRoutes", () => {
    let mockFetch: ReturnType<typeof vi.fn<[HonoLikeFetch], unknown>>;
    let mockApp: HonoLikeApp;
    let mockLogger: FpxLogger;

    beforeEach(() => {
      mockFetch = vi.fn().mockResolvedValue(new Response("OK"));
      mockApp = {
        routes: [{ method: "GET", path: "/test", handler: () => {} }],
        fetch: vi.fn(),
      } as unknown as HonoLikeApp;
      mockLogger = { debug: vi.fn() } as unknown as FpxLogger;
    });

    it("should respond with 200 OK when routes are sent successfully", async () => {
      const response = await respondWithRoutes(
        mockFetch as unknown as typeof fetch,
        "https://fpx.example.com",
        mockApp,
        mockLogger,
      );
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("OK");
    });

    it("should respond with 500 error when sending routes fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));
      const response = await respondWithRoutes(
        mockFetch as unknown as typeof fetch,
        "https://fpx.example.com",
        mockApp,
        mockLogger,
      );
      expect(response.status).toBe(500);
      expect(await response.text()).toBe("Error sending routes to FPX");
    });
  });
});
