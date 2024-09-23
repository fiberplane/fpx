import * as ts from "typescript";

export interface OutOfScopeIdentifier {
  /** The name of the identifier used but not declared within the function */
  name: string;
  /** The type of the identifier (always "unknown" in the current implementation) */
  type: string;
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
  functionNode: ts.FunctionDeclaration | ts.ArrowFunction,
  sourceFile: ts.SourceFile,
): OutOfScopeIdentifier[] {
  const localDeclarations = new Set<string>();
  const usedIdentifiers = new Map<string, ts.LineAndCharacter>();

  // First pass: collect local declarations
  ts.forEachChild(functionNode, function collectDeclarations(childNode) {
    if (
      ts.isVariableDeclaration(childNode) &&
      ts.isIdentifier(childNode.name)
    ) {
      localDeclarations.add(childNode.name.text);
    }
    if (ts.isParameter(childNode) && ts.isIdentifier(childNode.name)) {
      localDeclarations.add(childNode.name.text);
    }
    ts.forEachChild(childNode, collectDeclarations);
  });

  // Second pass: collect used identifiers
  ts.forEachChild(functionNode, function collectIdentifiers(childNode) {
    if (ts.isIdentifier(childNode)) {
      if (ts.isPropertyAccessExpression(childNode.parent)) {
        if (childNode === childNode.parent.name) {
          return; // Skip property names
        }
        if (
          childNode === childNode.parent.expression &&
          localDeclarations.has(childNode.text)
        ) {
          return; // Skip local variables used as base objects
        }
      }

      if (!localDeclarations.has(childNode.text)) {
        const pos = sourceFile.getLineAndCharacterOfPosition(
          childNode.getStart(),
        );
        usedIdentifiers.set(childNode.text, pos);
      }
    }
    ts.forEachChild(childNode, collectIdentifiers);
  });

  // Convert the map to an array of OutOfScopeIdentifier objects
  return Array.from(usedIdentifiers, ([name, position]) => ({
    name,
    type: "unknown",
    position,
  }));
}
