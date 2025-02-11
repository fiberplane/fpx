import path from "node:path";

import { shouldIgnoreFile } from "./utils.js";

describe("shouldIgnoreFile", () => {
  const ignoredPaths = [
    ".git",
    "node_modules",
    "dist",
    "out",
    "fpx.db",
    "fpx.db-journal",
    "mizu.db",
    "mizu.db-journal",
    ".fpx",
    ".fpxconfig",
    ".swc",
    ".wrangler",
    "*.log",
  ];

  it("should return true for null filename", () => {
    expect(shouldIgnoreFile(null, ignoredPaths)).toBe(true);
  });

  it("should return true for filename in ignoredPaths", () => {
    expect(shouldIgnoreFile("fpx.db", ignoredPaths)).toBe(true);
  });

  it("should return true for filename matching glob pattern in ignoredPaths", () => {
    expect(shouldIgnoreFile("somelogfile.log", ignoredPaths)).toBe(true);
  });

  it("should return true for filename inside ignored directory", () => {
    expect(
      shouldIgnoreFile(
        path.join(".wrangler", "tmp", "somefile.js"),
        ignoredPaths,
      ),
    ).toBe(true);
  });

  it("should return false for filename not in ignoredPaths", () => {
    expect(shouldIgnoreFile("somefile.js", ignoredPaths)).toBe(false);
  });

  it("should return false for filename not matching any pattern in ignoredPaths", () => {
    expect(shouldIgnoreFile("somefile.txt", ignoredPaths)).toBe(false);
  });

  it("should return false for filename in subdir not in ignoredPaths", () => {
    expect(
      shouldIgnoreFile(path.join("some", "dir", "somefile.js"), ignoredPaths),
    ).toBe(false);
  });

  it("should return false for filename in subdir not matching any pattern in ignoredPaths", () => {
    expect(
      shouldIgnoreFile(path.join("some", "dir", "somefile.txt"), ignoredPaths),
    ).toBe(false);
  });
});
