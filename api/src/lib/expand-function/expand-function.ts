import ts from "typescript";
import logger from "../../logger.js";
import {
  definitionToNode,
  getDefinitionText,
  getParentImportDeclaration,
} from "./ast-helpers/index.js";
import { followImport } from "./follow-import.js";
import {
  type FunctionOutOfScopeIdentifiers,
  searchForFunction,
} from "./search-function.js";
import {
  getDefinition,
  getFileUri,
  getTSServer,
  openFile,
} from "./tsserver/index.js";

// NOTES
// - given handler definition
// - find handler in codebase
// - look for anything it references
// - expand that code
// - (todo) REPEAT for each reference's value

export type ExpandedFunctionContext = Array<{
  /** The name of the constant or utility in the code */
  name: string;
  /** The type of the constant or utility (function, string, etc) */
  type: string;
  /** The position of the constant or utility in the code */
  position: { line: number; character: number };
  definition?: {
    uri: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    text: string;
  };
}>;

export type ExpandedFunctionResult = {
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
  context: ExpandedFunctionContext;
};

export async function expandFunction(
  projectRoot: string,
  srcPath: string,
  func: string,
): Promise<ExpandedFunctionResult | null> {
  const searchResult = searchForFunction(srcPath, func);
  if (!searchResult) {
    return null;
  }

  const context = await extractContext(
    projectRoot,
    searchResult.file,
    searchResult.identifiers,
  );
  return {
    ...searchResult,
    context,
  };
}

async function extractContext(
  projectRoot: string,
  filePath: string,
  identifiers: FunctionOutOfScopeIdentifiers,
): Promise<ExpandedFunctionContext> {
  const context: ExpandedFunctionContext = [];

  // TODO: Implement logic to extract context
  // This should involve:
  // 1. Finding the node for the function
  // 2. Analyzing its dependencies (imports, referenced variables, etc.)
  // 3. Populating the context array with relevant information

  if (!identifiers?.length) {
    logger.debug(
      "[debug] No out of scope identifiers found in function, skipping context extraction",
    );
    return [];
  }

  try {
    const connection = await getTSServer(projectRoot);

    // Open the document containing the function
    // We do this to get more information on the definitions of the function's out-of-scope identifiers
    // INVESTIGATE: Why do we need to open the file here? (Things were failing for me if I didn't do this)
    await openFile(connection, filePath);

    const funcFileUri = getFileUri(filePath);

    // Loop through each identifier in the function and find its definition
    for (const identifier of identifiers) {
      const definition = await getDefinition(
        connection,
        funcFileUri,
        identifier.position,
        identifier.name,
      );

      if (definition) {
        // Find the node at the definition position
        const { node, sourceFile, definitionFilePath } =
          definitionToNode(definition);

        logger.debug(`[debug] AST node for ${identifier.name}:`, node);

        // If there's a node, we can try to extract the value of the definition
        if (node) {
          // First, handle the case where it was imported from another file.
          // TODO - Handle node_modules, add some context about the module that was imported
          const parentImportDeclaration = getParentImportDeclaration(node);
          if (
            parentImportDeclaration &&
            ts.isImportDeclaration(parentImportDeclaration)
          ) {
            const importedDefinition = await followImport(
              connection,
              projectRoot,
              definitionFilePath,
              parentImportDeclaration,
              node,
            );
            if (importedDefinition) {
              const contextEntry = {
                name: identifier.name,
                type: identifier.type,
                position: identifier.position,
                definition: importedDefinition,
              };
              context.push(contextEntry);
              continue;
            }

            logger.warn(`Failed to follow import for ${identifier.name}`);
          }

          const valueText = getDefinitionText(node, sourceFile);

          const contextEntry = {
            name: identifier.name,
            type: identifier.type,
            position: identifier.position,
            definition: {
              uri: definition.uri,
              range: definition.range,
              text: valueText,
            },
          };

          logger.debug(
            `[debug] context entry for ${identifier.name}`,
            contextEntry,
          );

          context.push(contextEntry);
        } else {
          logger.warn(
            `AST parsing found no definition found for ${identifier.name} in ${definitionFilePath}`,
          );
        }
      } else {
        logger.warn(
          `TSServer found no definition found for ${identifier.name}`,
        );
      }
    }
  } catch (error) {
    logger.error("Error querying TSServer:", error);
  }

  return context;
}
