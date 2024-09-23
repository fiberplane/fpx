import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import logger from "../../logger.js";
import {
  type OutOfScopeIdentifier,
  analyzeOutOfScopeIdentifiers,
} from "./identifier-analyzer.js";

export type FunctionOutOfScopeIdentifiers = OutOfScopeIdentifier[];

type SearchFunctionResult = {
  /** The file in which the function was found */
  file: string;
  /** The line on which the function definition starts */
  startLine: number;
  /** The column on which the function definition starts */
  startColumn: number;
  /** The line on which the function definition ends */
  endLine: number;
  /** The column on which the function definition ends */
  endColumn: number;
  identifiers: FunctionOutOfScopeIdentifiers;
};

export function searchForFunction(
  dirPath: string,
  searchString: string,
): SearchFunctionResult | null {
  const files = fs.readdirSync(dirPath);

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
      const result = searchFile(filePath, searchString);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

/**
 * Searches for a function definition in a specific file.
 *
 * @param filePath - The absolute path to the file to search.
 * @param searchString - The exact string representation of the function to search for.
 *
 * @returns {SearchFunctionResult | null}
 *   - If found, returns a SearchFunctionResult object containing:
 *     - file: The absolute path of the file where the function was found.
 *     - startLine: The 1-indexed line number where the function definition starts.
 *     - startColumn: The 1-indexed column number where the function definition starts.
 *     - endLine: The 1-indexed line number where the function definition ends.
 *     - endColumn: The 1-indexed column number where the function definition ends.
 *     - identifiers: An array of FunctionOutOfScopeIdentifiers, each containing:
 *       - name: The name of the identifier used but not declared within the function.
 *       - type: Always "unknown" in the current implementation.
 *       - position: The LineAndCharacter object representing the identifier's position.
 *   - If not found, returns null.
 *
 * @description
 * This function uses the TypeScript Compiler API to parse the file and search for the function.
 * It performs an exact match on the function's string representation, including its body.
 * The search is case-sensitive and whitespace-sensitive.
 * Out-of-scope identifiers are determined by analyzing variable declarations and usages within the function.
 */
function searchFile(
  filePath: string,
  searchString: string,
): SearchFunctionResult | null {
  logger.debug("[debug] Searching file:", filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, "utf-8"),
    ts.ScriptTarget.Latest,
    true,
  );

  let result: SearchFunctionResult | null = null;

  function visit(node: ts.Node) {
    const isFunction =
      ts.isFunctionDeclaration(node) || ts.isArrowFunction(node);

    if (isFunction && node?.getText() === searchString) {
      logger.debug("[debug] matched function we were looking for!");
      const { line: startLine, character: startColumn } =
        sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const { line: endLine, character: endColumn } =
        sourceFile.getLineAndCharacterOfPosition(node.getEnd());

      // Replace the identifier analysis code with the new helper function
      const identifiers = analyzeOutOfScopeIdentifiers(node, sourceFile);

      result = {
        file: filePath,
        startLine: startLine + 1,
        startColumn: startColumn + 1,
        endLine: endLine + 1,
        endColumn: endColumn + 1,
        identifiers,
      };
    }

    // Only continue traversing if we haven't found a match yet
    if (!result) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);

  return result;
}
