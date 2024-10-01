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

// Add this import
import logger from "../../../logger.js";

// Mock the logger
vi.mock("../../../logger.js", () => ({
  default: {
    trace: vi.fn(),
    error: vi.fn(),
  },
}));

describe("searchSourceFunction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should look for a function in TypeScript files in a directory", async () => {
    // Mock the filesystem structure
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      "file1.ts" as unknown as fs.Dirent,
      "file2.tsx" as unknown as fs.Dirent,
      "file3.js" as unknown as fs.Dirent,
    ]);

    vi.mocked(fs.promises.stat).mockImplementation(
      async () =>
        ({
          isDirectory: () => false,
          isFile: () => true,
        }) as unknown as fs.Stats,
    );

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
    vi.mocked(searchFile).mockResolvedValueOnce(mockResult);

    const result = await searchSourceFunction(
      "/path/to",
      "function testFunc() {}",
    );

    expect(result).toEqual(mockResult);
    expect(fs.promises.readdir).toHaveBeenCalledWith("/path/to");
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/file1.ts",
      "function testFunc() {}",
    );
    expect(logger.trace).toHaveBeenCalled();
  });

  it("should return null if function is not found", async () => {
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      "file1.ts" as unknown as fs.Dirent,
      "file2.tsx" as unknown as fs.Dirent,
      "file3.js" as unknown as fs.Dirent,
    ]);

    vi.mocked(fs.promises.stat).mockResolvedValue({
      isDirectory: () => false,
      isFile: () => true,
    } as unknown as fs.Stats);

    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));

    vi.mocked(searchFile).mockResolvedValue(null);

    const result = await searchSourceFunction(
      "/path/to",
      "function notFound() {}",
    );

    expect(result).toBeNull();
    expect(fs.promises.readdir).toHaveBeenCalledWith("/path/to");
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/file1.ts",
      "function notFound() {}",
    );
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/file2.tsx",
      "function notFound() {}",
    );
    expect(searchFile).not.toHaveBeenCalledWith(
      "/path/to/file3.js",
      "function notFound() {}",
    );
  });

  it("should recursively search in subdirectories", async () => {
    // Mock the filesystem structure with a subdirectory
    vi.mocked(fs.promises.readdir)
      .mockResolvedValueOnce([
        "subdir" as unknown as fs.Dirent,
        "file1.ts" as unknown as fs.Dirent,
      ]) // First directory
      .mockResolvedValueOnce(["file2.ts" as unknown as fs.Dirent]); // Subdirectory

    vi.mocked(fs.promises.stat).mockImplementation(
      async (filePath) =>
        ({
          isDirectory: () => filePath.toString().endsWith("subdir"),
          isFile: () => !filePath.toString().endsWith("subdir"),
        }) as unknown as fs.Stats,
    );

    vi.mocked(path.join).mockImplementation((...args) => args.join("/"));

    vi.mocked(searchFile)
      .mockResolvedValueOnce(null) // file1.ts does not contain the function
      .mockResolvedValueOnce({
        file: "/path/to/subdir/file2.ts",
        startLine: 10,
        startColumn: 5,
        endLine: 15,
        endColumn: 10,
        node: {} as FunctionNode,
        sourceFile: {} as ts.SourceFile,
      } as unknown as ReturnType<typeof searchFile>);

    const result = await searchSourceFunction(
      "/path/to",
      "function recursiveFunc() {}",
    );

    expect(result).toEqual({
      file: "/path/to/subdir/file2.ts",
      startLine: 10,
      startColumn: 5,
      endLine: 15,
      endColumn: 10,
      node: {} as FunctionNode,
      sourceFile: {} as ts.SourceFile,
    });
    expect(fs.promises.readdir).toHaveBeenCalledWith("/path/to");
    expect(fs.promises.readdir).toHaveBeenCalledWith("/path/to/subdir");
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/file1.ts",
      "function recursiveFunc() {}",
    );
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/subdir/file2.ts",
      "function recursiveFunc() {}",
    );
    expect(logger.trace).toHaveBeenCalled();
  });

  it("should handle errors gracefully when reading directory", async () => {
    vi.mocked(fs.promises.readdir).mockRejectedValueOnce(
      new Error("Failed to read directory"),
    );

    const result = await searchSourceFunction(
      "/path/to",
      "function testFunc() {}",
    );

    expect(result).toBeNull();
    expect(fs.promises.readdir).toHaveBeenCalledWith("/path/to");
    expect(searchFile).not.toHaveBeenCalled();
  });

  it.skip("should handle errors gracefully when stat-ing a file", async () => {
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      "file1.ts" as unknown as fs.Dirent,
      "file2.tsx" as unknown as fs.Dirent,
      "file3.js" as unknown as fs.Dirent,
    ]);

    vi.mocked(fs.promises.stat).mockImplementation(async (filePath) => {
      if (filePath.toString().endsWith("file2.tsx")) {
        throw new Error("Failed to stat file");
      }
      return {
        isDirectory: () => false,
        isFile: () => true,
      } as unknown as fs.Stats;
    });

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
    vi.mocked(searchFile).mockResolvedValueOnce(mockResult);

    const result = await searchSourceFunction(
      "/path/to",
      "function testFunc() {}",
    );

    expect(result).toEqual(mockResult);
    expect(fs.promises.readdir).toHaveBeenCalledWith("/path/to");
    expect(fs.promises.stat).toHaveBeenCalledWith("/path/to/file1.ts");
    expect(fs.promises.stat).toHaveBeenCalledWith("/path/to/file2.tsx");
    expect(fs.promises.stat).not.toHaveBeenCalledWith("/path/to/file3.js");
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/file1.ts",
      "function testFunc() {}",
    );
    expect(searchFile).not.toHaveBeenCalledWith(
      "/path/to/file2.tsx",
      "function testFunc() {}",
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it("should ignore specified directories and files", async () => {
    vi.mocked(fs.promises.readdir).mockResolvedValue([
      "file1.ts" as unknown as fs.Dirent,
      "file2.tsx" as unknown as fs.Dirent,
      "file3.js" as unknown as fs.Dirent,
      "node_modules" as unknown as fs.Dirent,
      ".git" as unknown as fs.Dirent,
      "file1.ts" as unknown as fs.Dirent,
      ".hidden" as unknown as fs.Dirent,
      "README.md" as unknown as fs.Dirent,
    ]);

    vi.mocked(fs.promises.stat).mockImplementation(
      async (filePath) =>
        ({
          isDirectory: () => !filePath.toString().endsWith(".ts"),
          isFile: () => filePath.toString().endsWith(".ts"),
        }) as unknown as fs.Stats,
    );

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
    vi.mocked(searchFile).mockResolvedValueOnce(mockResult);

    const result = await searchSourceFunction(
      "/path/to",
      "function testFunc() {}",
    );

    expect(result).toEqual(mockResult);
    expect(fs.promises.readdir).toHaveBeenCalledWith("/path/to");
    expect(searchFile).toHaveBeenCalledWith(
      "/path/to/file1.ts",
      "function testFunc() {}",
    );
    expect(logger.trace).toHaveBeenCalled();
  });
});
