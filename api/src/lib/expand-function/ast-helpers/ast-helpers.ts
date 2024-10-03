import fs from "node:fs";
import * as ts from "typescript";
import { URI } from "vscode-uri";
import type { Definition as TSServerDefinition } from "../tsserver/index.js";
import type { FunctionContextType } from "../types.js";

export function getParentImportDeclaration(
  node: ts.Node,
): ts.ImportDeclaration | undefined {
  let parent = node.parent;
  while (parent && !ts.isSourceFile(parent)) {
    if (ts.isImportDeclaration(parent)) {
      return parent;
    }
    parent = parent.parent;
  }
  return undefined;
}

type DefinitionText = {
  type: FunctionContextType;
  text: string;
  definitionNode?: ts.Node;
};

export function getDefinitionText(
  node: ts.Node,
  sourceFile: ts.SourceFile,
): DefinitionText | undefined {
  // Check: Variable declaration with initializer
  // `const y = ...`
  // `let x = ...`
  if (ts.isVariableDeclaration(node) && node.initializer) {
    return {
      type: "unknown", // TODO
      text: node.initializer.getText(sourceFile),
    };
  }

  // Function declaration, arrow function, or function expression
  // Declaration: `function f() { ... }`
  // Arrow: `(c) => { ... }`
  // Expression: `const h = function () { ... }` (or e.g., a function passed inline as a callback)
  if (
    ts.isFunctionDeclaration(node) ||
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node)
  ) {
    return {
      type: "function",
      text: node.getText(sourceFile),
      definitionNode: node,
    };
  }

  // Check if the node is an identifier and if the parent node is a function declaration
  if (ts.isIdentifier(node) && ts.isFunctionDeclaration(node.parent)) {
    return {
      type: "function",
      text: node.parent.getText(sourceFile),
      definitionNode: node.parent,
    };
  }

  // Check if the node is an identifier and the parent node is a variable declaration with initializer
  // `const myVariable = someValue;`
  if (
    ts.isIdentifier(node) &&
    ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer
  ) {
    return {
      type: "unknown", // TODO
      text: node.parent.initializer.getText(sourceFile),
    };
  }

  // Check for type alias declarations
  // `type MyType = ...`
  if (ts.isTypeAliasDeclaration(node)) {
    return {
      type: "type",
      text: node.getText(sourceFile),
      definitionNode: node,
    };
  }

  // Check if the node is an identifier and the parent node is a type alias declaration
  if (ts.isIdentifier(node) && ts.isTypeAliasDeclaration(node.parent)) {
    return {
      type: "type",
      text: node.parent.getText(sourceFile),
      definitionNode: node.parent,
    };
  }

  return undefined;
}

export function findNodeAtPosition(
  sourceFile: ts.SourceFile,
  position: { line: number; character: number },
): ts.Node | undefined {
  function find(node: ts.Node): ts.Node | undefined {
    if (positionInNode(sourceFile, node, position)) {
      return ts.forEachChild(node, find) || node;
    }
  }
  return find(sourceFile);
}

function positionInNode(
  sourceFile: ts.SourceFile,
  node: ts.Node,
  position: { line: number; character: number },
): boolean {
  const { line, character } = position;
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  return (
    start.line <= line &&
    line <= end.line &&
    (start.line < line || start.character <= character) &&
    (line < end.line || character <= end.character)
  );
}

/**
 * Takes a definition from the TypeScript language server and returns the corresponding node and source file.
 *
 * @param definition - The definition object from the TypeScript language server
 * @returns An object containing the node, source file, and definition file path
 */
export function definitionToNode(definition: TSServerDefinition) {
  const definitionUri = URI.parse(definition.uri);
  const definitionFilePath = definitionUri.fsPath;

  // Read the file content for the file that contains the definition
  const fileContent = fs.readFileSync(definitionFilePath, "utf-8");

  // Parse the file to do ast analysis
  const sourceFile = ts.createSourceFile(
    definitionFilePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  const node = findNodeAtPosition(sourceFile, definition.range.start);

  return { node, sourceFile, definitionFilePath };
}
