import * as fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchFile } from "./search-file.js";

// Mock fs, but not typescript
vi.mock("node:fs");

describe("searchFile", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should find a function in a file", () => {
    const mockFileContent = `\nfunction testFunc() {
  console.log('Hello, world!');
}`;
    vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

    const result = searchFile(
      "/path/to/file.ts",
      "function testFunc() { console.log('Hello, world!'); }",
    );

    expect(result).toMatchObject({
      file: "/path/to/file.ts",
      startLine: 2,
      startColumn: 1,
      endLine: 4,
      endColumn: 2,
    });

    expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/file.ts", "utf-8");
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

  it("should match async functions even if search string does not include 'async'", () => {
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
  });

  it("should handle async arrow functions", () => {
    const mockFileContent = `const arrowFunc = async () => {
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
  });
});
