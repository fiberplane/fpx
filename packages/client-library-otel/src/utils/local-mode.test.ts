import { describe, expect, it } from "vitest";
import { ENV_FIBERPLANE_ENVIRONMENT } from "../constants";
import { isInLocalMode } from "./local-mode";

describe("local-mode", () => {
  describe("isInLocalMode", () => {
    it("should return true when FIBERPLANE_ENVIRONMENT is 'local'", () => {
      const env = { [ENV_FIBERPLANE_ENVIRONMENT]: "local" };
      expect(isInLocalMode(env, false)).toBe(true);
    });

    it("should return false when FIBERPLANE_ENVIRONMENT is not 'local'", () => {
      const env = { [ENV_FIBERPLANE_ENVIRONMENT]: "production" };
      expect(isInLocalMode(env, false)).toBe(false);
      expect(isInLocalMode(env, true)).toBe(false);
    });

    it("should return fallback of true when isLocalFallback parameter is true and no environment is set", () => {
      expect(isInLocalMode({}, true)).toBe(true);
    });

    it("should return fallback of false when isLocalFallback parameter is false and no environment is set", () => {
      expect(isInLocalMode({}, false)).toBe(false);
    });

    it("should handle null environment", () => {
      expect(isInLocalMode(null, false)).toBe(false);
      expect(isInLocalMode(null, true)).toBe(true);
    });

    it("should handle undefined environment", () => {
      expect(isInLocalMode(undefined, false)).toBe(false);
      expect(isInLocalMode(undefined, true)).toBe(true);
    });

    it("should prioritize FIBERPLANE_ENVIRONMENT over isLocal parameter", () => {
      const env = { [ENV_FIBERPLANE_ENVIRONMENT]: "local" };
      expect(isInLocalMode(env, false)).toBe(true);

      const prodEnv = { [ENV_FIBERPLANE_ENVIRONMENT]: "production" };
      expect(isInLocalMode(prodEnv, true)).toBe(false);
    });
  });
});
