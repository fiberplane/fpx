import ts from "typescript";
import logger from "../../logger.js";
import {
  type OutOfScopeIdentifier,
  analyzeOutOfScopeIdentifiers,
  definitionToNode,
  getDefinitionText,
  getParentImportDeclaration,
} from "./ast-helpers/index.js";
import { contextForImport } from "./imports/index.js";
import { searchForFunction } from "./search-function/index.js";
import {
  getFileUri,
  getTSServer,
  getTextDocumentDefinition,
  getTsSourceDefinition,
  openFile,
} from "./tsserver/index.js";

type ExpandedFunctionContextEntry = {
  /** The name of the constant or utility in the code */
  name: string;
  /**
   * The type of the constant or utility.
   * This will be used to help determine whether or not to recursively comb
   * helper utilities to expand context of their utilities, etc.
   *
   * For now, "unknown" is a placeholder for other ast nodes we may want to continue expanding.
   */
  type: "unknown" | "function";
  /** The position of the constant or utility in the code */
  position: { line: number; character: number };
  definition?: {
    uri: string;
    range: {
      start: { line: number; character: number };
      end: { line: number; character: number };
    };
    /** The text of the definition (utility function, constant value, etc.) */
    text: string | undefined;
  };
  /** The package (in node_modules) that the constant or utility is defined in */
  package?: string;
  /**
   * Hurrah for recursive types!
   *
   * The child context of the constant or utility.
   * That is, if the constant or utility is a function,
   * this will contain definitions for any of the function's out-of-scope identifiers.
   */
  context?: ExpandedFunctionContext;
};

export type ExpandedFunctionContext = Array<ExpandedFunctionContextEntry>;

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

/**
 * Expands the context of a specified function within the codebase by analyzing its out-of-scope identifiers
 * and recursively retrieving their definitions. This function searches for the target function, identifies
 * all external references it makes, and gathers detailed information about each reference to build a comprehensive
 * context. The result includes the location of the function and the expanded context of its dependencies.
 *
 * @param {string} projectRoot - The root directory of the project.
 * @param {string} srcPath - The source file path where the function is defined.
 * @param {string} func - The name of the function to expand.
 * @returns {Promise<ExpandedFunctionResult | null>} A promise that resolves to the expanded function context
 *                                                     or `null` if the function is not found.
 */
export async function expandFunction(
  projectRoot: string,
  srcPath: string,
  func: string,
): Promise<ExpandedFunctionResult | null> {
  const searchResult = searchForFunction(srcPath, func);
  if (!searchResult) {
    return null;
  }

  const identifiers = analyzeOutOfScopeIdentifiers(
    searchResult.node,
    searchResult.sourceFile,
    // true, // NOTE - Debug switch
  );

  const context = await extractContext(
    projectRoot,
    searchResult.file,
    identifiers,
  );

  // TODO - Recursively expand context of functions' sub-functions
  //
  //        Unsure whether should approach this with optimal solution first,
  //        of creating a "queue" of functions to expand, or just a simple
  //        recursive approach.

  return {
    ...searchResult,
    context,
  };
}

async function extractContext(
  projectRoot: string,
  filePath: string,
  identifiers: OutOfScopeIdentifier[],
): Promise<ExpandedFunctionContext> {
  const context: ExpandedFunctionContext = [];

  if (!identifiers?.length) {
    logger.debug(
      "[debug] No out of scope identifiers found in function, skipping context extraction",
    );
    return context;
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

      if (sourceDefinition) {
        // Find the node at the definition position
        const { node, sourceFile, definitionFilePath } =
          definitionToNode(sourceDefinition);

        // NOTE - This debug log is quite noisy, but can be helpful
        //
        // logger.debug(`[debug] AST node for ${identifier.name}:`, node);

        // If there's a node, we can try to extract the value of the definition
        if (node) {
          // First, handle the case where it was imported from another file.
          // As of writing, we *shouldn't* hit this case, but it's good as a fallback
          //
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

            // TODO - Recurse
            if (contextEntry) {
              context.push(contextEntry);
              continue;
            }

            logger.warn(
              `[extractContext] Failed to follow import for ${identifier.name}`,
            );
          }

          const valueText = getDefinitionText(node, sourceFile);

          // HACK - If we resolved the definition to node_modules,
          //        we can skip any recursive expansion and just add the import as context for now
          const isNodeModule = sourceDefinition?.uri?.includes("node_modules");

          // if (identifier.name === "drizzle") {
          //   console.log("drizzle sourceDefinition", sourceDefinition);
          //   console.log("drizzle textDocumentDefinition", textDocumentDefinition);
          //   console.log("drizzle isNodeModule", isNodeModule);
          // }

          if (identifier.name === "schema") {
            console.log("schema sourceDefinition", sourceDefinition);
            console.log(
              "schema textDocumentDefinition",
              textDocumentDefinition,
            );
          }

          if (isNodeModule) {
            logger.debug(
              `[debug] ${identifier.name} is likely an installed dependency`,
            );
            const contextEntry: ExpandedFunctionContextEntry = {
              name: identifier.name,
              type: valueText?.type ?? "unknown",
              position: identifier.position,
              definition: {
                uri: sourceDefinition.uri,
                range: sourceDefinition.range,
                // TODO - Truncate definition text here, since it can be huge (since this is from a node_modules package)
                text: valueText?.text,
              },
              package: extractPackageName(sourceDefinition.uri) ?? undefined,
            };
            context.push(contextEntry);
            continue;
          }

          const contextEntry: ExpandedFunctionContextEntry = {
            name: identifier.name,
            type: valueText?.type ?? "unknown",
            position: identifier.position,
            definition: {
              uri: sourceDefinition.uri,
              range: sourceDefinition.range,
              text: valueText?.text,
            },
          };

          logger.debug(
            `[debug] [extractContext] Context entry for ${identifier.name}`,
            contextEntry,
          );

          // Recursively expand context if the identifier is a function
          if (contextEntry?.type === "function") {
            // TODO - Check if this is necessary
            // await openFile(connection, sourceDefinition.uri);

            // @ts-expect-error - I haven't type-narrowed the `node` based off of the valueText.type
            //                    But just narrowing the node type would work and we could ditch the type property altogether?
            const functionBody = valueText?.definitionNode?.body ?? node?.body;
            const functionIdentifiers = analyzeOutOfScopeIdentifiers(
              functionBody,
              sourceFile,
              true,
            );

            logger.debug(
              `[debug] [extractContext] Analyzed NESTED out of scope identifiers for ${identifier.name}`,
              functionIdentifiers,
            );

            const subContext = await extractContext(
              projectRoot,
              sourceDefinition.uri.replace(/^file:\/\//, ""),
              functionIdentifiers,
            );
            contextEntry.context = subContext;
          }

          context.push(contextEntry);
        } else {
          logger.warn(
            `[extractContext] AST parsing found no definition found for ${identifier.name} in ${definitionFilePath}`,
          );
        }
      } else {
        logger.warn(
          `[extractContext] TSServer found no definition found for ${identifier.name}`,
        );
      }
    }
  } catch (error) {
    logger.error("[extractContext] Error querying TSServer:", error);
  }

  return context;
}

function extractPackageName(uri: string): string | null {
  try {
    const url = new URL(uri);
    const path = decodeURIComponent(url.pathname); // Decode URI components

    const nodeModulesIndex = path.indexOf("node_modules");

    if (nodeModulesIndex === -1) {
      return null;
    }

    const packagePath = path.substring(
      nodeModulesIndex + "node_modules/".length,
    );

    // Handle pnpm structure
    const pnpmIndex = packagePath.indexOf(".pnpm/");
    if (pnpmIndex !== -1) {
      const pnpmPath = packagePath.substring(pnpmIndex + ".pnpm/".length);
      const parts = pnpmPath.split("/");

      // Handle scoped packages
      if (parts[0].startsWith("@") && parts.length > 1) {
        return `${parts[0]}/${parts[1]}`;
      }

      return parts[0];
    }

    const parts = packagePath.split("/");

    // Handle scoped packages
    if (parts[0].startsWith("@") && parts.length > 1) {
      return `${parts[0]}/${parts[1]}`;
    }

    return parts[0];
  } catch (error) {
    logger.error("[extractPackageName] Error parsing URI:", uri, error);
    return null;
  }
}
