import ts from "typescript";
import logger from "../../logger.js";
import {
  definitionToNode,
  getDefinitionText,
  getParentImportDeclaration,
} from "./ast-helpers/index.js";
import { contextForImport } from "./imports/index.js";
import {
  type FunctionOutOfScopeIdentifiers,
  searchForFunction,
} from "./search-function.js";
import {
  getFileUri,
  getTSServer,
  getTextDocumentDefinition,
  getTsSourceDefinition,
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
    text: string | undefined;
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
    const { connection } = await getTSServer(projectRoot);

    // Open the document containing the function
    // This makes the TSServer aware of the codebase, and allows us to execute requests
    // We do this to get more information on the definitions of the function's out-of-scope identifiers
    //
    await openFile(connection, filePath);

    const funcFileUri = getFileUri(filePath);

    // Loop through each identifier in the function and find its definition
    for (const identifier of identifiers) {
      const [sourceDefinition, textDocumentDefinition] = await Promise.all([
        getTsSourceDefinition(connection, funcFileUri, identifier.position),
        getTextDocumentDefinition(connection, funcFileUri, identifier.position),
      ]);

      // logger.debug(
      //   `[debug] ts sourceDefinition for ${identifier.name}:`,
      //   JSON.stringify(sourceDefinition, null, 2),
      // );

      // logger.debug(
      //   `[debug] textDocumentDefinition for ${identifier.name}:`,
      //   JSON.stringify(textDocumentDefinition, null, 2),
      // );

      // Here we can filter out standard globals that are defined in the runtime
      //   (e.g., `console`, `URL`, `Number`, etc.)
      // We can do this because the textDocumentDefinition will be a .d.ts file, while the sourceDefinition will not be present
      // This is a bit of a hack, but it works for now
      const isStandardGlobal =
        !sourceDefinition && textDocumentDefinition?.uri?.endsWith(".d.ts");
      if (isStandardGlobal) {
        logger.debug(
          `[debug] Skipping expansion of ${identifier.name} as it is likely a standard global in the runtime`,
        );
        continue;
      }

      // TODO - Handle node_modules, add some context about the module that was imported

      if (sourceDefinition) {
        // Find the node at the definition position
        const { node, sourceFile, definitionFilePath } =
          definitionToNode(sourceDefinition);

        logger.debug(`[debug] AST node for ${identifier.name}:`, node);

        // If there's a node, we can try to extract the value of the definition
        if (node) {
          // First, handle the case where it was imported from another file.
          const parentImportDeclaration = getParentImportDeclaration(node);
          if (
            parentImportDeclaration &&
            ts.isImportDeclaration(parentImportDeclaration)
          ) {
            const contextEntry = await contextForImport(
              connection,
              projectRoot,
              definitionFilePath,
              parentImportDeclaration,
              node,
              identifier,
            );
            if (contextEntry) {
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
              uri: sourceDefinition.uri,
              range: sourceDefinition.range,
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
