import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import type { MessageConnection } from "vscode-jsonrpc";
import logger from "../../../logger.js";
import {
  type OutOfScopeIdentifier,
  getDefinitionText,
} from "../ast-helpers/index.js";
import { getFileUri, openFile } from "../tsserver/index.js";

export async function contextForImport(
  tsserver: MessageConnection,
  _projectRoot: string, // TODO - Use this to resolve node module imports
  currentFilePath: string,
  importNode: ts.ImportDeclaration,
  identifierNode: ts.Node,
  identifier: OutOfScopeIdentifier,
) {
  logger.info(
    `[debug] [contextForImport] Going to follow import for identifier: ${identifier.name}`,
  );
  const importedDefinition = await followImport(
    tsserver,
    _projectRoot,
    currentFilePath,
    importNode,
    identifierNode,
  );
  if (importedDefinition) {
    return {
      name: identifier.name,
      type: importedDefinition.type ?? "unknown",
      position: identifier.position,
      definition: importedDefinition,
    };
  }

  return null;
}

/**
 * Follows an import to the file it imports and returns the definition of the
 * identifier it contains.
 *
 * This is WILDLY INCOMPLETE and will fail in many, many cases.
 *
 * I only wrote this helper because I couldn't get the language server to follow
 * definitions to other files. (This has since been fixed, as far as I can tell.)
 *
 * If you find yourself needing to use this, consider the following fixes:
 *
 * - Resolving imports with special ts aliases (e.g. `@/...`)
 * - Handling different file extension for default imports (e.g. .tsx, .js, etc.)
 */
async function followImport(
  tsserver: MessageConnection,
  _projectRoot: string, // TODO - Use this to resolve node module imports
  currentFilePath: string,
  importNode: ts.ImportDeclaration,
  identifierNode: ts.Node,
) {
  const importPath = (importNode.moduleSpecifier as ts.StringLiteral).text;
  let resolvedPath: string;

  logger.debug(`[debug] [followImport] Import path: ${importPath}`);

  // TODO - Handle typescript config's aliased imports (`@/...`)
  if (importPath.startsWith(".")) {
    // Relative import
    resolvedPath = path.resolve(path.dirname(currentFilePath), importPath);
  } else {
    // NOTE - Skip node modules imports for now...
    // // Absolute import (assuming it's within the project)
    // resolvedPath = path.resolve(projectRoot, 'node_modules', importPath);

    return null;
  }

  logger.debug(`[debug] [followImport] Resolved import path: ${resolvedPath}`);

  // Add .ts extension if not present
  // TODO - Handle .tsx files, js files, etc.
  if (!resolvedPath.endsWith(".ts") && !resolvedPath.endsWith(".tsx")) {
    resolvedPath += ".ts";
  }

  if (!fs.existsSync(resolvedPath)) {
    logger.warn(`Could not resolve import path: ${resolvedPath}`);
    return null;
  }

  await openFile(tsserver, resolvedPath);

  const importedFileContent = fs.readFileSync(resolvedPath, "utf-8");
  const importedSourceFile = ts.createSourceFile(
    resolvedPath,
    importedFileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  // Find the definition in the imported file
  const importClause = importNode.importClause;
  if (importClause) {
    let identifierToFind: string | undefined;

    if (
      importClause.name &&
      importClause.name.text === identifierNode.getText()
    ) {
      // Default import
      identifierToFind = importClause.name.text;
    } else if (
      importClause.namedBindings &&
      ts.isNamedImports(importClause.namedBindings)
    ) {
      // Named import
      const namedImport = importClause.namedBindings.elements.find(
        (element) => element.name.text === identifierNode.getText(),
      );
      if (namedImport) {
        identifierToFind =
          namedImport.propertyName?.text || namedImport.name.text;
      }
    }

    if (identifierToFind) {
      logger.debug(
        `[debug] [followImport] Identifier to find in file we're importing from: ${identifierToFind}`,
      );
      const importedNode = findExportedDeclaration(
        importedSourceFile,
        identifierToFind,
      );
      if (importedNode) {
        const result = getDefinitionText(importedNode, importedSourceFile);

        const definitionText = result?.text;
        const definitionType = result?.type;

        return {
          uri: getFileUri(resolvedPath),
          range: {
            start: importedSourceFile.getLineAndCharacterOfPosition(
              importedNode.getStart(),
            ),
            end: importedSourceFile.getLineAndCharacterOfPosition(
              importedNode.getEnd(),
            ),
          },
          text: definitionText,
          type: definitionType,
        };
      }
    }
  }

  return null;
}

function findExportedDeclaration(
  sourceFile: ts.SourceFile,
  identifierName: string,
): ts.Node | undefined {
  return sourceFile.statements.find((statement) => {
    if (
      ts.isExportAssignment(statement) &&
      ts.isIdentifier(statement.expression)
    ) {
      return statement.expression.text === identifierName;
    }
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isVariableStatement(statement)
    ) {
      const modifiers = ts.getModifiers(statement);
      return (
        modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        ) &&
        (ts.isFunctionDeclaration(statement)
          ? statement.name?.text === identifierName
          : statement.declarationList.declarations[0].name.getText() ===
            identifierName)
      );
    }
    return false;
  });
}
