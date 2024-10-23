import type { SearchContext } from ".";
import type {
  SourceReference,
  TsArrowFunction,
  TsFunctionDeclaration,
  TsNode,
  TsType,
} from "../types";
import { findNodeAtPosition, getImportTypeDefinitionFileName } from "./utils";

function createSourceReferenceForFunctionLike(
  node: TsArrowFunction | TsFunctionDeclaration,
): SourceReference {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());

  return {
    character: position.character,
    line: position.line,
    fileName: sourceFile.fileName,
    content: node.getText(),
    references: [],
    modules: {},
  };
}

// Extract references from the arrow function
export function extractReferencesFromFunctionLike(
  functionLike: TsArrowFunction | TsFunctionDeclaration,
  context: SearchContext,
): SourceReference {
  const { ts, program, server, sourceReferenceManager } = context;
  const rootReference = createSourceReferenceForFunctionLike(functionLike);
  const sourceFile = functionLike.getSourceFile();

  const position = sourceFile.getLineAndCharacterOfPosition(
    functionLike.getStart(),
  );
  sourceReferenceManager.addReference(
    sourceFile.fileName,
    position.line,
    position.character,
    rootReference,
  );

  function visit(node: TsNode) {
    if (ts.isIdentifier(node)) {
      const dependencyResult = getImportTypeDefinitionFileName(
        ts,
        node,
        program,
      );
      if (dependencyResult) {
        const { isExternalLibrary, location, ...dependency } = dependencyResult;
        if (isExternalLibrary) {
          // Add dependency to the root reference
          context.sourceReferenceManager.addModuleToReference(
            sourceFile.fileName,
            position.line,
            position.character,
            dependency,
          );
          return;
        }
      }

      const checker = program.getTypeChecker();
      const symbol = checker.getSymbolAtLocation(node);

      const declarations = symbol?.getDeclarations();
      if (!declarations || declarations.length === 0) {
        return;
      }

      const declaration = declarations[0];
      const declSourceFile = declaration.getSourceFile();

      if (dependencyResult) {
        const references = server.getReferencesAtPosition(
          declSourceFile.fileName,
          declaration.getStart(),
        );

        if (!references) {
          // const p = declSourceFile
          console.log("Wait there are no references", declSourceFile.fileName, declaration.getText())
          return;
        }
        // Find reference in the right file
        const reference = references.find(
          (ref) => ref.fileName === dependencyResult.location,
        );

        if (reference) {
          const refFile = program.getSourceFile(reference.fileName);
          const refNode = findNodeAtPosition(
            ts,
            refFile,
            reference.textSpan.start,
          );

          const symbol = checker.getSymbolAtLocation(refNode);
          const declarations = symbol?.getDeclarations();
          if (declarations?.length === 1) {
            const declaration = declarations[0];
            const nodeValue = ts.isVariableDeclaration(declaration)
              ? declaration.initializer
              : declaration;
            if (
              ts.isFunctionDeclaration(nodeValue) ||
              ts.isArrowFunction(nodeValue)
            ) {
              const targetPosition = refFile.getLineAndCharacterOfPosition(reference.textSpan.start);
              const sourceReference = sourceReferenceManager.getReference(dependencyResult.location, targetPosition.line, targetPosition.character) || extractReferencesFromFunctionLike(nodeValue, context)
              rootReference.references.push(
                sourceReference,
              );
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(functionLike);
  return rootReference;
}
