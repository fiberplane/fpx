import logger from "../../../logger.js";
import { getSourceFunctionText } from "./search-compiled-function.js";
import type { SearchFunctionResult } from "./search-file.js";
import { searchSourceFunction } from "./search-source-function.js";

/**
 * Searches for a function within the project source code.
 *
 * This function attempts to locate a specified function within the project's source files.
 * It performs two main searches:
 *
 * 1. Directly searches for the function string in the source.
 * 2. Retrieves the source function text via a source map and searches using the mapped text.
 *
 * This is ripe for optimization.
 *
 * @param projectPath - The path to the project directory.
 * @param functionString - The string representation of the function to search for.
 * @param options - Optional parameters for the search.
 * @param options.skipSourceMap - If true, the source map search will be skipped. Useful for tests.
 * @returns A promise that resolves to a {@link SearchFunctionResult} if found, or `null` otherwise.
 */
export async function searchFunction(
  projectPath: string,
  functionString: string,
  options: { skipSourceMap?: boolean } = {},
): Promise<SearchFunctionResult | null> {
  // Attempt to search the function directly in the source.
  try {
    const directResult = await searchSourceFunction(
      projectPath,
      functionString,
    );
    if (directResult) {
      return directResult;
    }
  } catch (error) {
    logger.error(`Error searching for function directly in source: ${error}`);
  }

  if (options.skipSourceMap) {
    return null;
  }

  // Attempt to retrieve the source function text via a source map and search.
  try {
    const sourceFunction = await getSourceFunctionText(
      projectPath,
      functionString,
    );
    if (sourceFunction) {
      try {
        const mappedResult = await searchSourceFunction(
          projectPath,
          sourceFunction,
        );
        if (mappedResult) {
          return mappedResult;
        }
      } catch (error) {
        logger.error(
          `Error searching for function via source mapping: ${error}`,
        );
      }
    }
  } catch (error) {
    logger.error(`Error retrieving source function text: ${error}`);
  }

  // If the function was not found in either search, return null.
  return null;
}
