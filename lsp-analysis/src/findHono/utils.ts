import type { SearchContext } from "../types";
import type {
  ModuleReference,
  TsModuleResolutionHost,
  TsNode,
  TsSourceFile,
  TsType,
} from "../types";

export function findNodeAtPosition(
  ts: TsType,
  sourceFile: TsSourceFile,
  position: number,
): TsNode | undefined {
  function find(node: TsNode): TsNode | undefined {
    if (position >= node.getStart() && position < node.getEnd()) {
      return ts.forEachChild(node, find) || node;
    }
    return undefined;
  }

  return find(sourceFile);
}

export function inspectNode(node: TsNode, ts: TsType) {
  console.log("node", node.kind, ts.SyntaxKind[node.kind], node.getText());
  console.log("Inspecting node", {
    // isFunctionExpression: ts.isFunctionExpression(node),
    // isArrowFunction: ts.isArrowFunction(node),
    // isFunctionDeclaration: ts.isFunctionDeclaration(node),
    // isFunctionTypeNode: ts.isFunctionTypeNode(node),
    // isCallExpression: ts.isCallExpression(node),
    // isPropertyAccessExpression: ts.isPropertyAccessExpression(node),
    // isIdentifier: ts.isIdentifier(node),
    // isStringLiteral: ts.isStringLiteral(node),
    // isNumericLiteral: ts.isNumericLiteral(node),
    // isObjectLiteralExpression: ts.isObjectLiteralExpression(node),
    // isTypeLiteralNode: ts.isTypeLiteralNode(node),
    // isTypeReferenceNode: ts.isTypeReferenceNode(node),
    // isTypeQueryNode: ts.isTypeQueryNode(node),
    // isTypePredicateNode: ts.isTypePredicateNode(node),
    // // isTypeAssertion: ts.isTypeAssertion(node),
    // isAsExpression: ts.isAsExpression(node),
    // isNonNullExpression: ts.isNonNullExpression(node),
    // isNonNullChain: ts.isNonNullChain(node),
    // isParenthesizedExpression: ts.isParenthesizedExpression(node),
    // isSpreadElement: ts.isSpreadElement(node),
    // isShorthandPropertyAssignment: ts.isShorthandPropertyAssignment(node),
    // isPropertyAssignment: ts.isPropertyAssignment(node),
    // isPropertyDeclaration: ts.isPropertyDeclaration(node),
    // isPropertySignature: ts.isPropertySignature(node),
    // isAccessor: ts.isAccessor(node),
    isImportAttribute: ts.isImportAttribute(node),
    isImportAttributeName: ts.isImportAttributeName(node),
    isImportAttributes: ts.isImportAttributes(node),
    isImportClause: ts.isImportClause(node),
    isImportDeclaration: ts.isImportDeclaration(node),
    isImportEqualsDeclaration: ts.isImportEqualsDeclaration(node),
    isImportOrExportSpecifier: ts.isImportOrExportSpecifier(node),
    isImportSpecifier: ts.isImportSpecifier(node),
    isImportTypeAssertionContainer: ts.isImportTypeAssertionContainer(node),
    isImportTypeNode: ts.isImportTypeNode(node),
  });
}

export function getImportTypeDefinitionFileName(
  node: TsNode,
  context: SearchContext,
):
  | (ModuleReference & { isExternalLibrary: boolean; location: string })
  | undefined {
  const { ts, checker, program } = context;
  const symbol = checker.getSymbolAtLocation(node);

  const declarations = symbol?.getDeclarations();
  if (!declarations || declarations.length === 0) {
    return;
  }
  const declaration = declarations[0];

  const declarationFileName = declaration.getSourceFile().fileName;
  const nodeFileName = node.getSourceFile().fileName;
  const compilerOptions = program.getCompilerOptions();
  const host: TsModuleResolutionHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  };

  // Is the type coming from another file than the current file? Then it
  // probably comes from a type definition file (like
  // `@cloudflare/workers-types` and is specified in compilerOptions.type section
  // of the tsconfig
  if (nodeFileName !== declarationFileName) {
    // Check if the type is specified in the types section of the tsconfig
    if (compilerOptions.types) {
      const type = compilerOptions.types.find((name) =>
        nodeFileName.indexOf(name),
      );
      if (type) {
        const result = ts.resolveModuleName(
          type,
          nodeFileName,
          compilerOptions,
          host,
        );
        if (result.resolvedModule.isExternalLibraryImport) {
          return;
        }
      }
    }
  }

  let target = declaration.parent;
  while (
    target &&
    !ts.isImportDeclaration(target) &&
    !ts.isExportDeclaration(target)
  ) {
    target = target.parent;
  }

  if (
    !target ||
    (!ts.isImportDeclaration(target) && !ts.isExportDeclaration(target))
  ) {
    return;
  }

  const text = target.moduleSpecifier.getText().slice(1, -1);

  const result = ts.resolveModuleName(
    text,
    nodeFileName,
    compilerOptions,
    host,
  );

  // Handle external imports
  if (result.resolvedModule?.isExternalLibraryImport) {
    return {
      import: node.getText(),
      importPath: text,
      name: result.resolvedModule.packageId.name,
      version: result.resolvedModule.packageId.version,
      isExternalLibrary: true,
      location: result.resolvedModule.resolvedFileName,
    };
  }

  // Handle build in modules
  if (text.startsWith("node:")) {
    return {
      import: node.getText(),
      importPath: text,
      name: text,
      isExternalLibrary: true,
      location: node.getText(),
    };
  }

  // Other module
  return {
    import: node.getText(),
    importPath: text,
    name: text,
    isExternalLibrary: false,
    location: result.resolvedModule.resolvedFileName,
  };
}
