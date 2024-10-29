import type { SearchContext, TsIdentifier } from "../types";
import type {
  SourceReference,
  TsArrowFunction,
  TsCallExpression,
  TsDeclaration,
  TsExportSpecifier,
  TsFunctionDeclaration,
  TsNode,
  TsReferenceEntry,
  TsTypeAliasDeclaration,
  TsVariableDeclaration,
} from "../types";
import { findNodeAtPosition, getImportTypeDefinitionFileName } from "./utils";

// Extract references for a node and its children
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
    return existingReference;
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
  const { ts } = context;

  if (ts.isIdentifier(currentNode)) {
    visitIdentifier(
      currentNode,
      context,
      rootReference,
      startPosition,
      rootNodeReference,
    );
    return;
  }

  ts.forEachChild(currentNode, (node) =>
    visit(node, context, rootReference, startPosition, rootNodeReference),
  );
}

function visitIdentifier(
  currentNode: TsIdentifier,
  context: SearchContext,
  rootReference: SourceReference,
  startPosition: number,
  rootNodeReference: TsNode = currentNode,
) {
  const { ts, getFile, checker, sourceReferenceManager } = context;
  const sourceFile = getFile(rootReference.fileName);
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

  const symbol = checker.getSymbolAtLocation(currentNode);
  const declarations = symbol?.getDeclarations() || [];
  const [declaration] = declarations;
  if (!declaration || symbol?.flags === ts.SymbolFlags.FunctionScopedVariable) {
    return;
  }

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
    console.warn(
      `No references found: (file: ${declSourceFile.fileName} at position: ${declaration.getStart()})`,
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
