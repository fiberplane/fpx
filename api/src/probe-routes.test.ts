import { resolveServiceArg } from "./probe-routes.js";

describe("resolveServiceArg", () => {
  it("should default to http://localhost:8787", () => {
    expect(resolveServiceArg(undefined)).toBe("http://localhost:8787");
    expect(resolveServiceArg("")).toBe("http://localhost:8787");
    expect(resolveServiceArg(0)).toBe("http://localhost:8787");
    expect(resolveServiceArg("0")).toBe("http://localhost:8787");
    expect(resolveServiceArg("invalid")).toBe("http://localhost:8787");
  });

  it("should return the same URL when passed a full URL", () => {
    expect(resolveServiceArg("http://localhost:1234")).toBe(
      "http://localhost:1234",
    );
    expect(resolveServiceArg("http://localhost:8787")).toBe(
      "http://localhost:8787",
    );
  });

  it("should resolve a port number to a localhost URL", () => {
    expect(resolveServiceArg(8787)).toBe("http://localhost:8787");
    expect(resolveServiceArg("8787")).toBe("http://localhost:8787");
    expect(resolveServiceArg(1234)).toBe("http://localhost:1234");
    expect(resolveServiceArg("1234")).toBe("http://localhost:1234");
  });

  it("should use the default URL or port if the first argument is empty, falsy, or invalid", () => {
    expect(resolveServiceArg("", "http://localhost:1234")).toBe(
      "http://localhost:1234",
    );
    expect(resolveServiceArg(undefined, "http://localhost:1234")).toBe(
      "http://localhost:1234",
    );
    expect(resolveServiceArg(undefined)).toBe("http://localhost:8787");
    expect(resolveServiceArg(0)).toBe("http://localhost:8787");
    expect(resolveServiceArg("0")).toBe("http://localhost:8787");
    expect(resolveServiceArg("invalid")).toBe("http://localhost:8787");
  });
});
