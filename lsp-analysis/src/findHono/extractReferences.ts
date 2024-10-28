import { J } from "vitest/dist/chunks/reporters.C4ZHgdxQ.js";
import type { SearchContext } from ".";
import type {
  SourceReference,
  TsArrowFunction,
  TsCallExpression,
  TsDeclaration,
  TsExportSpecifier,
  TsFunctionDeclaration,
  TsNode,
  TsReferenceEntry,
  TsSyntaxKind,
  TsTypeAliasDeclaration,
  TsVariableDeclaration,
} from "../types";
import {
  findNodeAtPosition,
  getImportTypeDefinitionFileName,
  inspectNode,
} from "./utils";

// Extract references from the arrow function
export function createSourceReferenceForNode(
  rootNode:
    | TsArrowFunction
    | TsFunctionDeclaration
    | TsCallExpression
    | TsTypeAliasDeclaration
    | TsExportSpecifier
    | TsVariableDeclaration,
  context: SearchContext,
): SourceReference {
  const { sourceReferenceManager } = context;
  const sourceFile = rootNode.getSourceFile();
  const fileName = sourceFile.fileName;
  const existingReference = sourceReferenceManager.getReference(
    fileName,
    rootNode.getStart(),
  );

  if (existingReference) {
    console.debug("Warning: source reference already exists", {
      fileName,
      start: rootNode.getStart(),
    });
  }

  const rootReference = createInitialSourceReferenceForNode(rootNode, context);
  sourceReferenceManager.addReference(
    fileName,
    rootNode.getStart(),
    rootReference,
  );

  visit(rootNode, context, rootReference, rootNode.getStart());
  return rootReference;
}

function visit(
  currentNode: TsNode,
  context: SearchContext,
  rootReference: SourceReference,
  startPosition: number,
  rootNodeReference: TsNode = currentNode,
) {
  const { ts, checker, sourceReferenceManager, getFile } = context;
  const sourceFile = getFile(rootReference.fileName);

  if (ts.isIdentifier(currentNode)) {
    const dependencyResult = getImportTypeDefinitionFileName(
      currentNode,
      context,
    );
    if (dependencyResult) {
      const { isExternalLibrary, location, ...dependency } = dependencyResult;
      if (isExternalLibrary) {
        // Add dependency to the root reference
        context.sourceReferenceManager.addModuleToReference(
          sourceFile.fileName,
          startPosition,
          dependency,
        );
        return;
      }
    }
    // const checker = program.getTypeChecker();
    const symbol = checker.getSymbolAtLocation(currentNode);

    const declarations = symbol?.getDeclarations();
    if (
      !declarations ||
      declarations.length === 0 ||
      symbol?.flags === ts.SymbolFlags.FunctionScopedVariable
    ) {
      return;
    }

    const declaration = declarations[0];
    // const declSourceFile = declaration.getSourceFile();

    const nodeValue = dependencyResult
      ? getNodeValueForDependency(dependencyResult, context, declaration)
      : getLocalDeclaration(declaration, currentNode);

    // No valid node value found? Skip
    if (!nodeValue) {
      return;
    }

    if (
      (rootNodeReference.getStart() > nodeValue.getEnd() ||
        rootNodeReference.getEnd() < nodeValue.getStart()) &&
      (ts.isFunctionDeclaration(nodeValue) ||
        ts.isArrowFunction(nodeValue) ||
        ts.isCallExpression(nodeValue) ||
        ts.isTypeAliasDeclaration(nodeValue) ||
        ts.isExportSpecifier(nodeValue) ||
        ts.isVariableDeclaration(nodeValue))
    ) {
      const sourceReference =
        sourceReferenceManager.getReference(
          nodeValue.getSourceFile().fileName,
          nodeValue.getStart(),
        ) || createSourceReferenceForNode(nodeValue, context);
      if (currentNode.getText() === "user") {
        console.log("nodeValue", currentNode.parent.kind, !!dependencyResult);
      }
      rootReference.references.push(sourceReference);
      return;
    }
    if (
      ts.isBindingElement(nodeValue) ||
      ts.isPropertySignature(nodeValue) ||
      ts.isPropertyAssignment(nodeValue) ||
      ts.isTypeParameterDeclaration(nodeValue)
    ) {
      // console.log('binding element', nodeValue.getText(), symbol.getFlags(), symbol.getName());
      return;
    }

    // console.log(
    //   "nodeValue",
    //   nodeValue.kind,
    //   //   nodeValue.getText(),
    //   //   nodeValue.getStart(),
    //   //   currentNode.getText(),
    //   //   currentNode.getStart(),
    // );
    // console.log(
    //   {
    //     currentNode: currentNode.getText(),
    //     declSourceFile: nodeValue.getSourceFile().fileName,
    //     sourceFile: sourceFile.fileName,
    //     "currentNode.getStart": currentNode.getStart(),
    //     "declaration.getStart": declaration.getStart(),
    //     "currentNode.getEnd": currentNode.getEnd(),
    //     "declaration.getEnd": declaration.getEnd(),
    //     "same file": nodeValue.getSourceFile().fileName === sourceFile.fileName,
    //     "inside range": (currentNode.getStart() < declaration.getStart() &&
    //       currentNode.getEnd() > declaration.getEnd())
    //   }
    // )

    // inspectNode(nodeValue, context.ts);
    // console.log("nodeValue", currentNode.getText(), nodeValue.kind, possibleReferences.length);

    // throw new NodeTypeNotSupportedError(nodeValue);

    // }
    // }

    // console.log("We should not get here", currentNode.getText())
    // } else {
    // if (currentNode.getText() === "DEFAULT_USER_NAME") {
    // console.log(
    //   {
    //     currentNode: currentNode.getText(),
    //     declSourceFile: declSourceFile.fileName,
    //     sourceFile: sourceFile.fileName,
    //     "currentNode.getStart": currentNode.getStart(),
    //     "declaration.getStart": declaration.getStart(),
    //     "currentNode.getEnd": currentNode.getEnd(),
    //     "declaration.getEnd": declaration.getEnd(),
    //     "same file": declSourceFile.fileName === sourceFile.fileName,
    //     "inside range": (currentNode.getStart() < declaration.getStart() &&
    //       currentNode.getEnd() > declaration.getEnd())
    //   }
    // )
    // if (
    //   declSourceFile.fileName === sourceFile.fileName &&
    //   (currentNode.getStart() > declaration.getStart() &&
    //     currentNode.getEnd() < declaration.getEnd())
    // ) {
    //   console.log('declaration', declaration.kind)
    // }
    // } else {
    //   console.log('eh', currentNode.getText(), currentNode.parent.kind, sourceFile.fileName);
    // }
    // console.log('symbol', symbol, 'declarations', declarations);
    // console.log('no dependency result?', rootReference.fileName, currentNode.getText(), declaration.kind);
    // }
  }

  ts.forEachChild(currentNode, (node) =>
    visit(node, context, rootReference, startPosition, rootNodeReference),
  );
}

function getNodeValueForDependency(
  dependencyResult: ReturnType<typeof getImportTypeDefinitionFileName>,
  context: SearchContext,
  declaration: TsDeclaration,
) {
  const { service, getFile, program, ts } = context;

  const declSourceFile = declaration.getSourceFile();
  const references: Array<TsReferenceEntry> =
    service.getReferencesAtPosition(
      declSourceFile.fileName,
      declaration.getStart(),
    ) || [];

  if (!references) {
    console.log(
      "Wait there are no references",
      declSourceFile.fileName,
      declaration.getText(),
    );
    return;
  }

  // Find reference in the right file
  const possibleReferences = references.filter(
    (ref) => ref.fileName === dependencyResult.location,
  );

  const checker = program.getTypeChecker();
  for (const reference of possibleReferences) {
    const refFile =
      getFile(reference.fileName) || program.getSourceFile(reference.fileName);
    const refNode = findNodeAtPosition(ts, refFile, reference.textSpan.start);

    const symbol = checker.getSymbolAtLocation(refNode);
    const declarations = symbol?.getDeclarations();
    if (declarations?.length === 1) {
      const declaration = declarations[0];
      const nodeValue = ts.isVariableDeclaration(declaration)
        ? declaration.initializer
        : declaration;

      return nodeValue;
    }
  }
}

/**
 * Get the node related to a declaration that is inside the same file as the current node.
 *
 * But only if declaration is outside the current node (otherwise it is already in scope of the current node)
 */
function getLocalDeclaration(declaration: TsDeclaration, currentNode: TsNode) {
  // Declaration should end before the current node starts or start after the current node ends
  // otherwise recursive references could be created
  if (
    (declaration.getEnd() < currentNode.getStart() ||
      declaration.getStart() > currentNode.getEnd()) &&
    declaration.getSourceFile().fileName ===
      currentNode.getSourceFile().fileName
  ) {
    return declaration;
  }

  // if (currentNode.getText() === "DEFAULT_USER_NAME") {
  //   console.log("fall through", {
  //     before: declaration.getEnd() < currentNode.getStart(),
  //     "after?": declaration.getStart() > currentNode.getEnd(),
  //     "same file":
  //       declaration.getSourceFile().fileName ===
  //       currentNode.getSourceFile().fileName,
  //     currentNode: currentNode.getText(),
  //     declaration: declaration.getText(),
  //   });
  // }
}
class NodeTypeNotSupportedError extends Error {
  fileName: string;
  line: number;
  character: number;
  text: string;
  kind: TsSyntaxKind;

  constructor(node: TsNode) {
    const { fileName, line, character, text, kind } =
      NodeTypeNotSupportedError.extractNodeMetadata(node);
    const message = `Node of kind ${kind} is not supported at ${fileName}:${line}:${character}\nNode text: ${text}`;
    super(message);
    this.name = "NodeTypeNotSupportedError";
    this.fileName = fileName;
    this.line = line;
    this.character = character;
    this.text = text;
    this.kind = kind;
  }

  private static extractNodeMetadata(node: TsNode) {
    const fileName = node.getSourceFile().fileName;
    const { line, character } = node
      .getSourceFile()
      .getLineAndCharacterOfPosition(node.getStart());
    const text = node.getText();
    const kind = node.kind;
    return { fileName, line, character, text, kind };
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}

function createSourceReferenceContentForNode(
  node:
    | TsArrowFunction
    | TsFunctionDeclaration
    | TsCallExpression
    | TsTypeAliasDeclaration
    | TsExportSpecifier
    | TsVariableDeclaration,
  context: SearchContext,
) {
  const { ts } = context;
  if (
    ts.isCallExpression(node) &&
    ts.isVariableDeclarationList(node.parent.parent)
  ) {
    return node.parent.parent.getText();
  }

  if (
    ts.isVariableDeclaration(node) &&
    ts.isVariableDeclarationList(node.parent)
  ) {
    return node.parent.getText();
  }

  if (ts.isExportSpecifier(node)) {
    return `export { ${node.getText()} } from ${node.parent.parent.moduleSpecifier.getText()}`;
    // return findModulePathFromExportSpecified(node);
  }
  return node.getText();
}

function createInitialSourceReferenceForNode(
  node:
    | TsArrowFunction
    | TsFunctionDeclaration
    | TsCallExpression
    | TsTypeAliasDeclaration
    | TsExportSpecifier
    | TsVariableDeclaration,
  context: SearchContext,
): SourceReference {
  const sourceFile = node.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());

  return {
    character: position.character,
    line: position.line,
    fileName: sourceFile.fileName,
    content: createSourceReferenceContentForNode(node, context),
    references: [],
    modules: {},
  };
}

function findModulePathFromExportSpecified(node: TsExportSpecifier): string {
  const exportDeclaration = node.parent.parent;
  return exportDeclaration.moduleSpecifier.getText();
  // const exportStatement = exportDeclaration.parent;
  // const moduleSpecifier = exportStatement.moduleSpecifier;
  // return moduleSpecifier.getText();
}
