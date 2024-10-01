import * as fs from "node:fs";
import * as path from "node:path";
import logger from "../../../logger.js";
import { type SearchFunctionResult, searchFile } from "./search-file.js";

/**
 * Recursively searches for a function in a directory and its subdirectories.
 *
 * - Ignores hidden directories and node_modules
 * - Only looks in .ts and .tsx files
 *
 * @param dirPath - The directory to search in, typically the project root.
 * @param searchString - The (stringified) function to search for.
 * @returns The result of the search, or null if the function is not found.
 */
export function searchSourceFunction(
  dirPath: string,
  searchString: string,
): SearchFunctionResult | null {
  const files = fs.readdirSync(dirPath);
  logger.trace("[trace] [searchForFunction] Searching files:", files);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      if (shouldIgnoreDirent(file)) {
        continue;
      }
      // Recursively search directories
      const result = searchSourceFunction(filePath, searchString);
      if (result) {
        return result;
      }
    } else if (
      stats.isFile() &&
      (file.endsWith(".ts") || file.endsWith(".tsx"))
    ) {
      logger.trace("[trace] [searchForFunction] Searching file:", file);
      const result = searchFile(filePath, searchString);
      logger.trace("[trace] [searchForFunction] Result:", result);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Returns true if the file should be ignored.
 * Ignores hidden directories and node_modules, for example.
 */
function shouldIgnoreDirent(dirent: string): boolean {
  const ignoredDirs = [
    "node_modules",
    ".git",
    ".vscode",
    ".idea",
    "dist",
    "build",
    "coverage",
    "tmp",
    "temp",
    ".wrangler",
    ".next",
    ".cache",
    ".husky",
    ".yarn",
    ".nx",
  ];

  const ignoredPrefixes = [".", "_"];

  return (
    ignoredDirs.includes(dirent.toLowerCase()) ||
    ignoredPrefixes.some((prefix) => dirent.startsWith(prefix)) ||
    dirent.endsWith(".log") ||
    dirent.endsWith(".md")
  );
}
