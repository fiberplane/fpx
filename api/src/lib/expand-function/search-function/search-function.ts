import * as fs from "node:fs";
import * as path from "node:path";
import logger from "../../../logger.js";
import { type SearchFunctionResult, searchFile } from "./search-file.js";

export function searchForFunction(
  dirPath: string,
  searchString: string,
): SearchFunctionResult | null {
  const files = fs.readdirSync(dirPath);
  logger.debug("[debug] files", files);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      // Skip hidden directories and node_modules
      if (file.startsWith(".") || file === "node_modules") {
        continue;
      }
      const result = searchForFunction(filePath, searchString);
      if (result) {
        return result;
      }
    } else if (
      stats.isFile() &&
      (file.endsWith(".ts") || file.endsWith(".tsx"))
    ) {
      logger.debug("[debug] searching file", file);
      const result = searchFile(filePath, searchString);
      logger.debug("[debug] result", result);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

export { searchFile, type SearchFunctionResult } from "./search-file.js";
