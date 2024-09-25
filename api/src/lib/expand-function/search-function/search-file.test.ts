import * as fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchFile } from "./search-file";

// Mock fs and analyzeOutOfScopeIdentifiers, but not typescript
vi.mock("node:fs");
vi.mock("../ast-helpers/index.js", () => ({
  analyzeOutOfScopeIdentifiers: vi.fn().mockReturnValue([]),
}));

import { analyzeOutOfScopeIdentifiers } from "../ast-helpers/index.js";

describe("searchFile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should find a function in a file", () => {
    const mockFileContent = `function testFunc() {
  console.log('Hello, world!');
}`;
    vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

    const result = searchFile(
      "/path/to/file.ts",
      "function testFunc() { console.log('Hello, world!'); }",
    );

    expect(result).toMatchObject({
      file: "/path/to/file.ts",
      startLine: 1,
      startColumn: 1,
      endLine: 3,
      endColumn: 2,
    });

    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/file.ts", "utf-8");
    expect(analyzeOutOfScopeIdentifiers).toHaveBeenCalled();
  });

  it("should return null if function is not found", () => {
    const mockFileContent = `function differentFunc() {
  console.log('Not the function we\'re looking for');
}`;
    vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

    const result = searchFile("/path/to/file.ts", "function testFunc() {}");

    expect(result).toBeNull();

    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/file.ts", "utf-8");
  });

  it("should handle async functions", () => {
    const mockFileContent = `async function testAsyncFunc() {
  await someAsyncOperation();
}`;
    vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

    const result = searchFile(
      "/path/to/file.ts",
      "function testAsyncFunc() { await someAsyncOperation(); }",
    );

    expect(result).toMatchObject({
      file: "/path/to/file.ts",
      startLine: 1,
      startColumn: 1,
      endLine: 3,
      endColumn: 2,
    });

    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/file.ts", "utf-8");
    expect(analyzeOutOfScopeIdentifiers).toHaveBeenCalled();
  });

  it("should handle arrow functions", () => {
    const mockFileContent = `const arrowFunc = () => {
  return 'Arrow function';
};`;
    vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

    const result = searchFile(
      "/path/to/file.ts",
      "() => { return 'Arrow function'; }",
    );

    expect(result).toMatchObject({
      file: "/path/to/file.ts",
      startLine: 1,
      startColumn: 19,
      endLine: 3,
      endColumn: 2,
    });

    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/file.ts", "utf-8");
    expect(analyzeOutOfScopeIdentifiers).toHaveBeenCalled();
  });
});
