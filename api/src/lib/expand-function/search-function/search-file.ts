import * as fs from "node:fs";
import * as ts from "typescript";
import logger from "../../../logger.js";
import {
  type OutOfScopeIdentifier,
  analyzeOutOfScopeIdentifiers,
} from "../ast-helpers/index.js";

export type FunctionOutOfScopeIdentifiers = OutOfScopeIdentifier[];

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
  identifiers: FunctionOutOfScopeIdentifiers;
};

export function searchFile(
  filePath: string,
  searchString: string,
): SearchFunctionResult | null {
  logger.debug("[debug] Searching file:", filePath);
  logger.debug("[debug] Search string:", searchString);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  logger.debug("[debug] File content:", fileContent);
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  logger.debug("[debug] Source file:", sourceFile);

  let result: SearchFunctionResult | null = null;

  function visit(node: ts.Node) {
    const isFunction =
      ts.isFunctionDeclaration(node) ||
      ts.isArrowFunction(node) ||
      ts.isFunctionExpression(node);

    if (isFunction) {
      let functionText = node.getText(sourceFile).trim();
      logger.debug("[debug] Found function:", functionText);

      // HACK - Remove the `async` keyword if it is at the beginning
      if (
        node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword,
        )
      ) {
        functionText = functionText.replace(/^\s*async\s*/, "");
        logger.debug("[debug] Removed async keyword:", functionText);
      }

      // Normalize whitespace in both the function text and search string
      // TODO - Check that this doesn't break anything
      const normalizedFunctionText = functionText.replace(/\s+/g, " ");
      const normalizedSearchString = searchString.replace(/\s+/g, " ");

      logger.debug(
        "[debug] Comparing:",
        normalizedFunctionText,
        "with:",
        normalizedSearchString,
      );
      if (normalizedFunctionText === normalizedSearchString) {
        logger.debug("[debug] Match found!");
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
    }

    // Only continue traversing if we haven't found a match yet
    if (!result) {
      ts.forEachChild(node, visit);
    }
  }

  visit(sourceFile);

  logger.debug("[debug] Search result:", result);
  return result;
}
