import logger from "../../../logger.js";
import { getSourceFunctionText } from "./search-compiled-function.js";
import type { SearchFunctionResult } from "./search-file.js";
import { searchSourceFunction } from "./search-source-function.js";

// TODO - Tidy this up
export async function searchFunction(
  projectPath: string,
  functionString: string,
) {
  return Promise.all([
    new Promise<SearchFunctionResult | null>((resolve) => {
      try {
        const result = searchSourceFunction(projectPath, functionString);
        if (result) {
          logger.debug(
            `[searchFunction] Found function directly in source: ${result}`,
          );
        }
        resolve(result);
      } catch (error) {
        logger.error(`Error searching for function: ${error}`);
        resolve(null);
      }
    }),
    new Promise<SearchFunctionResult | null>((resolve) => {
      getSourceFunctionText(projectPath, functionString)
        .then((sourceFunction) => {
          logger.debug(
            "[debug] [searchFunction] function text from source map:",
            sourceFunction,
          );
          if (sourceFunction) {
            try {
              const result = searchSourceFunction(projectPath, sourceFunction);
              if (result) {
                logger.debug(
                  `[searchFunction] Found function by mapping back to source: ${result}`,
                );
              }
              resolve(result);
            } catch (error) {
              logger.error(`Error searching for function: ${error}`);
              resolve(null);
            }
          } else {
            logger.debug(
              "[searchFunction] No source function found via source map",
            );
            resolve(null);
          }
        })
        .catch((error) => {
          logger.error(`Error searching for function: ${error}`);
          resolve(null);
        });
    }),
  ]).then((results) => {
    logger.debug(
      "[debug][searchFunction] results",
      results.map((result) => (result ? result.file : null)),
    );
    return results.find(
      (result) => result !== null,
    ) as SearchFunctionResult | null;
  });
}
