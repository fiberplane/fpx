import * as fs from "node:fs";
import * as ts from "typescript";
import logger from "../../../logger.js";
import type { FunctionNode } from "../types.js";

export type SearchFunctionResult = {
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

  /** The node that was found */
  node: FunctionNode;
  /** The source file that was found */
  sourceFile: ts.SourceFile;

  // identifiers: FunctionOutOfScopeIdentifiers;
};

/**
 * Searches for a specific function in a TypeScript file.
 *
 * @param filePath - The path to the TypeScript file to search.
 * @param searchString - The function text to search for.
 * @param debug - Optional. If true, enables debug logging. Default is false. This exists because always having debug logs on kinda pollutes the console in dev.
 * @returns A SearchFunctionResult object if the function is found, null otherwise.
 *
 * @description
 * This function reads the content of the specified TypeScript file and searches for a function
 * that matches the provided searchString. It handles function declarations, arrow functions,
 * and function expressions. The function also normalizes whitespace and handles async functions
 * by optionally removing the 'async' keyword during comparison.
 *
 * If a match is found, it returns a SearchFunctionResult object containing file information,
 * start and end positions of the function, and the TypeScript AST node and SourceFile.
 */
export function searchFile(
  filePath: string,
  searchString: string,
  debugg = false,
): SearchFunctionResult | null {
  // TODO - Remove
  const debug = debugg || filePath.includes("githubWebhooksMiddleware");
  if (debug) {
    logger.debug("[debug][searchFile] Searching file:", filePath);
  }
  const fileContent = fs.readFileSync(filePath, "utf-8");
  if (debug) {
    logger.debug("[debug][searchFile] File content:", fileContent);
  }
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  if (debug) {
    logger.debug("[debug][searchFile] Source file:", sourceFile);
  }

  let result: SearchFunctionResult | null = null;

  function visit(node: ts.Node) {
    const isFunction =
      ts.isFunctionDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node);

    if (isFunction) {
      const functionText = node.getText(sourceFile).trim();
      let functionTextWithoutAsync = functionText;
      if (debug) {
        logger.debug("[debug][searchFile] Found function:", functionText);
      }

      // HACK - Remove the `async` keyword if it is at the beginning
      if (
        node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
        )
      ) {
        functionTextWithoutAsync = functionTextWithoutAsync.replace(
          /^\s*async\s*/,
          "",
        );
        if (debug) {
          logger.debug(
            "[debug][searchFile] Removed async keyword:",
            functionText,
          );
        }
      }

      // Normalize whitespace in both the function text and search string
      // TODO - Check that this doesn't break anything
      const normalizedFunctionText = functionText.replace(/\s+/g, " ");
      const normalizedFunctionTextWithoutAsync =
        functionTextWithoutAsync.replace(/\s+/g, " ");
      const normalizedSearchString = searchString.replace(/\s+/g, " ");

      if (debug) {
        logger.debug(
          "[debug][searchFile] Comparing:",
          normalizedFunctionText,
          "with:",
          normalizedSearchString,
        );
      }

      // TODO - Need to fix upstream issue with source map parsing before resolving this...
      const hackyIncludes =
        normalizedSearchString?.length > 25
          ? normalizedFunctionText.includes(normalizedSearchString)
          : false;
      if (
        hackyIncludes ||
        normalizedFunctionText === normalizedSearchString ||
        normalizedFunctionTextWithoutAsync === normalizedSearchString
      ) {
        if (debug) {
          logger.debug("[debug][searchFile] Match found!");
        }

        const { line: startLine, character: startColumn } =
          sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine, character: endColumn } =
          sourceFile.getLineAndCharacterOfPosition(node.getEnd());

        // Replace the identifier analysis code with the new helper function
        // const identifiers = analyzeOutOfScopeIdentifiers(node, sourceFile);

        result = {
          file: filePath,
          startLine: startLine + 1,
          startColumn: startColumn + 1,
          endLine: endLine + 1,
          endColumn: endColumn + 1,
          node,
          sourceFile,
        };
      }
    }

    // Only continue traversing if we haven't found a match yet
    if (!result) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);

  if (debug) {
    logger.debug("[debug][searchFile] Search result:", result);
  }
  return result;
}
