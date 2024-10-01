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
export function searchForFunction(
  dirPath: string,
  searchString: string,
): SearchFunctionResult | null {
  const files = fs.readdirSync(dirPath);
  logger.debug("[debug] [searchForFunction] Searching files:", files);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Skip hidden directories and node_modules
      if (file.startsWith(".") || file === "node_modules") {
        continue;
      }
      // Recursively search directories
      const result = searchForFunction(filePath, searchString);
      if (result) {
        return result;
      }
    } else if (
      stats.isFile() &&
      (file.endsWith(".ts") || file.endsWith(".tsx"))
    ) {
      logger.debug("[debug] [searchForFunction] Searching file:", file);
      const result = searchFile(filePath, searchString);
      logger.debug("[debug] [searchForFunction] Result:", result);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

export { searchFile, type SearchFunctionResult } from "./search-file.js";
