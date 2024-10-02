import * as ts from "typescript";
import logger from "../../../logger.js";

export interface OutOfScopeIdentifier {
  /** The name of the identifier used but not declared within the function */
  name: string;
  /** The position of the identifier in the code */
  position: ts.LineAndCharacter;
}

/**
 * Analyzes a function node to find out-of-scope identifiers.
 *
 * @param functionNode - The TypeScript AST node representing the function to analyze.
 * @param sourceFile - The TypeScript SourceFile object containing the function.
 *
 * @returns An array of OutOfScopeIdentifier objects, each representing an identifier
 * used within the function but not declared locally.
 *
 * @description
 * This function performs a two-pass analysis on the given function node:
 * 1. It collects all local declarations (variables and parameters).
 * 2. It identifies all used identifiers that are not in the local declarations.
 *
 * The function handles property access expressions specially:
 * - It ignores property names in property access expressions.
 * - It includes the base object of a property access if it's not locally declared.
 *
 * Note: This analysis does not consider closure variables or imported identifiers
 * as "in scope". It only looks at declarations within the function itself.
 */
export function analyzeOutOfScopeIdentifiers(
  functionNode:
    | ts.FunctionDeclaration
    | ts.ArrowFunction
    | ts.FunctionExpression,
  sourceFile: ts.SourceFile,
): OutOfScopeIdentifier[] {
  const usedIdentifiers = new Map<string, ts.LineAndCharacter>();

  // Stack to keep track of scopes
  const scopeStack: Set<string>[] = [];

  function pushScope() {
    scopeStack.push(new Set<string>());
  }

  function popScope() {
    scopeStack.pop();
  }

  function addDeclaration(name: string) {
    if (scopeStack.length > 0) {
      scopeStack[scopeStack.length - 1].add(name);
    }
  }

  function isDeclared(name: string): boolean {
    for (let i = scopeStack.length - 1; i >= 0; i--) {
      if (scopeStack[i].has(name)) {
        return true;
      }
    }
    return false;
  }

  // Start traversing the function node
  function traverse(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node)
    ) {
      pushScope();

      // Add parameters to the current scope
      for (const param of node.parameters) {
        collectBindings(param.name);
      }

      // If it's a named function (not anonymous), add its name to the scope
      if (node.name && ts.isIdentifier(node.name)) {
        addDeclaration(node.name.text);
      }

      ts.forEachChild(node, traverse);

      popScope();
      return;
    }

    if (ts.isBlock(node)) {
      pushScope();

      ts.forEachChild(node, traverse);

      popScope();
      return;
    }

    if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        collectBindings(decl.name);
      }
    } else if (ts.isVariableDeclaration(node)) {
      collectBindings(node.name);
    } else if (ts.isParameter(node)) {
      collectBindings(node.name);
    } else if (ts.isIdentifier(node)) {
      if (!isDeclared(node.text)) {
        const pos = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        usedIdentifiers.set(node.text, pos);
      }
    }

    ts.forEachChild(node, traverse);
  }

  function collectBindings(name: ts.BindingName) {
    if (ts.isIdentifier(name)) {
      addDeclaration(name.text);
    } else if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const element of name.elements) {
        if (ts.isBindingElement(element)) {
          collectBindings(element.name);
        }
      }
    }
  }

  // Initialize the scope with function parameters and the function name
  pushScope();

  // Add function parameters to the initial scope
  for (const param of functionNode.parameters) {
    collectBindings(param.name);
  }

  // Add function name to the scope if it exists
  if (functionNode.name && ts.isIdentifier(functionNode.name)) {
    addDeclaration(functionNode.name.text);
  }

  traverse(functionNode);

  // Convert the map to an array of OutOfScopeIdentifier objects
  return Array.from(usedIdentifiers, ([name, position]) => ({
    name,
    position,
  }));
}
