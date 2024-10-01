import * as fs from "node:fs";
import * as path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FunctionNode } from "../types.js";

// Mock the search-file module, as we test that separately
vi.mock("./search-file.js", () => ({
  searchFile: vi.fn(),
}));

import type ts from "typescript";
import { searchFile } from "./search-file.js";
// Import after mocking
import { searchSourceFunction } from "./search-source-function.js";

// Mock the fs and path modules
vi.mock("node:fs");
vi.mock("node:path");
vi.mock("typescript");

describe("searchForFunction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should look for a function in a typescript files in a directory", () => {
    // Mock the filesystem structure
    vi.mocked(fs.readdirSync).mockReturnValue([
      "file1.ts",
      "file2.tsx",
      "file3.js",
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
      isFile: () => true,
    } as unknown as fs.Stats);
    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));

    // Mock the searchFile function to return a result for file1.ts
    const mockResult = {
      file: "/path/to/file1.ts",
      startLine: 1,
      startColumn: 1,
      endLine: 5,
      endColumn: 2,
      node: {} as FunctionNode,
      sourceFile: {} as ts.SourceFile,
    };
    vi.mocked(searchFile).mockReturnValueOnce(mockResult);

    const result = searchSourceFunction("/path/to", "function testFunc() {}");

    expect(result).toEqual(mockResult);
    expect(fs.readdirSync).toHaveBeenCalledWith("/path/to");
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/file1.ts",
      "function testFunc() {}",
    );
  });

  it("should return null if function is not found", () => {
    vi.mocked(fs.readdirSync).mockReturnValue([
      "file1.ts",
    ] as unknown as fs.Dirent[]);
    vi.mocked(fs.statSync).mockReturnValue({
      isDirectory: () => false,
      isFile: () => true,
    } as unknown as fs.Stats);
    vi.mocked(searchFile).mockReturnValueOnce(null);

    const result = searchSourceFunction("/path/to", "function notFound() {}");

    expect(result).toBeNull();
  });
});
