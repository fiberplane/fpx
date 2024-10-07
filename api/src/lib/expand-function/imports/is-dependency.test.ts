import { isDependency } from "./is-dependency.js";

describe("isDependency", () => {
  test("should return true for npm/yarn node_modules path", () => {
    expect(isDependency("/project/node_modules/package/file.js")).toBe(true);
  });

  test("should return true for yarn zero-installs path", () => {
    expect(
      isDependency(
        "/project/.yarn/cache/package-version-integrity/node_modules/package/file.js",
      ),
    ).toBe(true);
  });

  test("should return true for pnpm path", () => {
    expect(
      isDependency(
        "/project/.pnpm/package@version/node_modules/package/file.js",
      ),
    ).toBe(true);
  });

  test("should return false for non-dependency path", () => {
    expect(isDependency("/project/src/components/file.js")).toBe(false);
  });

  test("should return false for path with similar name but not a dependency", () => {
    expect(isDependency("/project/my-node-modules-like-folder/file.js")).toBe(
      false,
    );
  });

  test("should handle Windows-style paths", () => {
    expect(isDependency("C:\\project\\node_modules\\package\\file.js")).toBe(
      true,
    );
  });

  test("should return false for empty string", () => {
    expect(isDependency("")).toBe(false);
  });
});
