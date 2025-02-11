import type { Context } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logIfDebug } from "./debug.js";

describe("logIfDebug", () => {
  beforeEach(() => {
    // Mock console.debug before each test
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("with boolean flag", () => {
    it("should log when debug is true", () => {
      logIfDebug(true, "test message", "param1", "param2");
      expect(console.debug).toHaveBeenCalledWith(
        "[fiberplane:debug] ",
        "test message",
        "param1",
        "param2",
      );
    });

    it("should not log when debug is false", () => {
      logIfDebug(false, "test message", "param1", "param2");
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe("with Context", () => {
    it("should log when context debug variable is true", () => {
      const mockContext = {
        get: vi.fn().mockReturnValue(true),
      } as unknown as Context;

      logIfDebug(mockContext, "test message", "param1", "param2");
      expect(console.debug).toHaveBeenCalledWith(
        "[fiberplane:debug] ",
        "test message",
        "param1",
        "param2",
      );
    });

    it("should not log when context debug variable is false", () => {
      const mockContext = {
        get: vi.fn().mockReturnValue(false),
      } as unknown as Context;

      logIfDebug(mockContext, "test message", "param1", "param2");
      expect(console.debug).not.toHaveBeenCalled();
    });

    it("should not log when context debug variable is undefined", () => {
      const mockContext = {
        get: vi.fn().mockReturnValue(undefined),
      } as unknown as Context;

      logIfDebug(mockContext, "test message", "param1", "param2");
      expect(console.debug).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully when context.get throws", () => {
      const mockContext = {
        get: vi.fn().mockImplementation(() => {
          throw new Error("Test error");
        }),
      } as unknown as Context;

      // Should not throw
      expect(() => {
        logIfDebug(mockContext, "test message", "param1", "param2");
      }).not.toThrow();

      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined params array", () => {
      logIfDebug(true, "test message");
      expect(console.debug).toHaveBeenCalledWith(
        "[fiberplane:debug] ",
        "test message",
      );
    });

    it("should handle various types of messages", () => {
      const testCases = [
        { msg: 123 },
        { msg: null },
        { msg: undefined },
        { msg: { test: "object" } },
        { msg: ["array"] },
      ];

      for (const { msg } of testCases) {
        logIfDebug(true, msg);
        expect(console.debug).toHaveBeenCalledWith("[fiberplane:debug] ", msg);
      }
    });
  });
});
