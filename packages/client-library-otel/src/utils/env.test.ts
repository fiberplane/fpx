import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromEnv, getPlatformSafeEnv } from "./env";

describe("env utils", () => {
  describe("getFromEnv", () => {
    it("should return value when single key exists in env", () => {
      const env = { TEST_KEY: "test_value" };
      expect(getFromEnv(env, "TEST_KEY")).toBe("test_value");
    });

    it("should return null when single key doesn't exist", () => {
      const env = { OTHER_KEY: "value" };
      expect(getFromEnv(env, "TEST_KEY")).toBe(null);
    });

    it("should handle array of keys and return first matching value", () => {
      const env = {
        SECOND_KEY: "second_value",
        THIRD_KEY: "third_value",
      };
      expect(getFromEnv(env, ["FIRST_KEY", "SECOND_KEY", "THIRD_KEY"])).toBe(
        "second_value",
      );
    });

    it("should return null when no keys in array match", () => {
      const env = { OTHER_KEY: "value" };
      expect(getFromEnv(env, ["KEY1", "KEY2"])).toBe(null);
    });

    it("should handle null env object", () => {
      expect(getFromEnv(null, "TEST_KEY")).toBe(null);
    });

    it("should handle undefined env object", () => {
      expect(getFromEnv(undefined, "TEST_KEY")).toBe(null);
    });

    it("should handle non-object env parameter", () => {
      expect(getFromEnv("not an object", "TEST_KEY")).toBe(null);
    });
  });

  describe("getPlatformSafeEnv", () => {
    const originalProcess = global.process;
    const mockProcessEnv = { NODE_ENV: "test" };
    const mockHonoEnv = { incoming: {}, outgoing: {} };

    beforeEach(() => {
      vi.stubGlobal("process", { env: mockProcessEnv });
    });

    afterEach(() => {
      vi.stubGlobal("process", originalProcess);
      vi.unstubAllGlobals();
    });

    it("should return process.env in Node.js Hono environment", () => {
      const result = getPlatformSafeEnv(mockHonoEnv);
      expect(result).toBe(mockProcessEnv);
    });

    it("should return honoEnv when not in Node.js or Deno environment", () => {
      // Temporarily remove process.env
      const tempProcess = global.process;
      vi.stubGlobal("process", undefined);

      const customEnv = { CUSTOM_KEY: "value" };
      const result = getPlatformSafeEnv(customEnv);
      expect(result).toBe(customEnv);

      // Restore process
      vi.stubGlobal("process", tempProcess);
    });

    it("should handle null honoEnv", () => {
      // Temporarily remove process.env
      const tempProcess = global.process;
      vi.stubGlobal("process", undefined);

      const result = getPlatformSafeEnv(null);
      expect(result).toBe(null);

      // Restore process
      vi.stubGlobal("process", tempProcess);
    });

    // Note: We can't easily test Deno environment since it requires mocking globalThis.env
    // which is more complex. In a real environment, that would be handled by the Deno runtime.
  });
});
