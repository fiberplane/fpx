import fs from "node:fs";
import * as ts from "typescript";
import { URI } from "vscode-uri";

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

export function getDefinitionText(node: ts.Node, sourceFile: ts.SourceFile) {
  // debugger;

  // Check: Variable declaration with initializer
  // `const y = ...`
  // `let x = ...`
  if (ts.isVariableDeclaration(node) && node.initializer) {
    return node.initializer.getText(sourceFile);
  }

  // Function declaration or arrow function
  // `function f() { ... }`
  // `(c) => { ... }`
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node)) {
    return node.getText(sourceFile);
  }

  // Check if the node is an identifier and if the parent node is a function declaration
  if (ts.isIdentifier(node) && ts.isFunctionDeclaration(node.parent)) {
    return node.parent.getText(sourceFile);
  }

  // Check if the node is an identifier and the parent node is a variable declaration with initializer
  // `const myVariable = someValue;`
  if (
    ts.isIdentifier(node) &&
    ts.isVariableDeclaration(node.parent) &&
    node.parent.initializer
  ) {
    return node.parent.initializer.getText(sourceFile);
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

// NOTE - Takes a definition from the typescript language server
//        and returns the node and source file
//
// biome-ignore lint/suspicious/noExplicitAny: We don't have a type for the definition response yet
export function definitionToNode(definition: any) {
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

  // Find the node at the definition position
  const node = findNodeAtPosition(sourceFile, definition.range.start);

  return { node, sourceFile, definitionFilePath };
}
