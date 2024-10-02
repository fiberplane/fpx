import { promises as fs } from "node:fs";
import type { Stats } from "node:fs";
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
 * @param debug - Whether to log debug information - this is an explicit switch because otherwise the console gets too noisy
 * @returns The result of the search, or null if the function is not found.
 */
export async function searchSourceFunction(
  dirPath: string,
  searchString: string,
  options: { debug?: boolean; sourceHint?: string } = { debug: false },
): Promise<SearchFunctionResult | null> {
  const { debug, sourceHint } = options;
  // HACK - The sourceHint is a path to a file that contains the function we are trying to expand
  //        We will receive this as a hint if we did source map parsing to find the definition of the function
  if (sourceHint) {
    if (debug) {
      logger.debug(
        `[debug] [searchSourceFunction] Searching for function: ${searchString} in directory: ${dirPath} with source hint: ${sourceHint}`,
      );
    }
    const result = await searchFile(sourceHint, searchString);
    if (result) {
      return result;
    }
  }
  let files: string[];
  try {
    files = await fs.readdir(dirPath);
    if (debug) {
      logger.debug("[debug] [searchForFunction] Searching files:", files);
    }
  } catch (error) {
    logger.error(
      `[error] [searchForFunction] Failed to read directory: ${dirPath}`,
      error,
    );
    return null;
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    let stats: Stats;
    try {
      stats = await fs.stat(filePath);
    } catch (error) {
      logger.error(
        `[error] [searchForFunction] Failed to stat file: ${filePath}`,
        error,
      );
      continue;
    }

    if (stats.isDirectory()) {
      if (shouldIgnoreDirent(file)) {
        continue;
      }
      // Recursively search directories
      const result = await searchSourceFunction(filePath, searchString);
      if (result) {
        return result;
      }
    } else if (
      stats.isFile() &&
      (file.endsWith(".ts") || file.endsWith(".tsx"))
    ) {
      if (debug) {
        logger.debug("[debug] [searchForFunction] Searching file:", file);
      }
      let result: SearchFunctionResult | null;
      try {
        result = await searchFile(filePath, searchString);
        if (debug && result) {
          logger.debug("[debug] [searchForFunction] Result:", result);
        }
      } catch (error) {
        logger.error(
          `[error] [searchForFunction] Failed to search file: ${filePath}`,
          error,
        );
        continue;
      }
      if (debug) {
        logger.debug("[debug] [searchForFunction] Result:", result);
      }
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
