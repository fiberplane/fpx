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

// export function inspectNode(node: TsNode, ts: TsType) {
//   console.log("node", node.kind, ts.SyntaxKind[node.kind], node.getText());
//   console.log("Inspecting node", {
//     // isFunctionExpression: ts.isFunctionExpression(node),
//     // isArrowFunction: ts.isArrowFunction(node),
//     // isFunctionDeclaration: ts.isFunctionDeclaration(node),
//     // isFunctionTypeNode: ts.isFunctionTypeNode(node),
//     // isCallExpression: ts.isCallExpression(node),
//     // isPropertyAccessExpression: ts.isPropertyAccessExpression(node),
//     // isIdentifier: ts.isIdentifier(node),
//     // isStringLiteral: ts.isStringLiteral(node),
//     // isNumericLiteral: ts.isNumericLiteral(node),
//     // isObjectLiteralExpression: ts.isObjectLiteralExpression(node),
//     // isTypeLiteralNode: ts.isTypeLiteralNode(node),
//     // isTypeReferenceNode: ts.isTypeReferenceNode(node),
//     // isTypeQueryNode: ts.isTypeQueryNode(node),
//     // isTypePredicateNode: ts.isTypePredicateNode(node),
//     // // isTypeAssertion: ts.isTypeAssertion(node),
//     // isAsExpression: ts.isAsExpression(node),
//     // isNonNullExpression: ts.isNonNullExpression(node),
//     // isNonNullChain: ts.isNonNullChain(node),
//     // isParenthesizedExpression: ts.isParenthesizedExpression(node),
//     // isSpreadElement: ts.isSpreadElement(node),
//     // isShorthandPropertyAssignment: ts.isShorthandPropertyAssignment(node),
//     // isPropertyAssignment: ts.isPropertyAssignment(node),
//     // isPropertyDeclaration: ts.isPropertyDeclaration(node),
//     // isPropertySignature: ts.isPropertySignature(node),
//     // isAccessor: ts.isAccessor(node),
//     isImportAttribute: ts.isImportAttribute(node),
//     isImportAttributeName: ts.isImportAttributeName(node),
//     isImportAttributes: ts.isImportAttributes(node),
//     isImportClause: ts.isImportClause(node),
//     isImportDeclaration: ts.isImportDeclaration(node),
//     isImportEqualsDeclaration: ts.isImportEqualsDeclaration(node),
//     isImportOrExportSpecifier: ts.isImportOrExportSpecifier(node),
//     isImportSpecifier: ts.isImportSpecifier(node),
//     isImportTypeAssertionContainer: ts.isImportTypeAssertionContainer(node),
//     isImportTypeNode: ts.isImportTypeNode(node),
//   });
// }

export function getImportTypeDefinitionFileName(
  node: TsNode,
  context: SearchContext,
):
  | (ModuleReference & { isExternalLibrary: boolean; location: string })
  | undefined {
  const { ts, checker, program, resourceManager } = context;
  const symbol = checker.getSymbolAtLocation(node);

  const declarations = symbol?.getDeclarations();
  if (!declarations || declarations.length === 0) {
    return;
  }
  const declaration = declarations[0];

  // const declarationFileName = declaration.getSourceFile().fileName;
  const nodeFileName = node.getSourceFile().fileName;
  const compilerOptions = program.getCompilerOptions();
  const host: TsModuleResolutionHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  };

  // // Is the type coming from another file than the current file? Then it
  // // probably comes from a type definition file (like
  // // `@cloudflare/workers-types` and is specified in compilerOptions.type section
  // // of the tsconfig
  // if (nodeFileName !== declarationFileName) {
  //   console.log('compileroptions.types', compilerOptions.types);
  //   // Check if the type is specified in the types section of the tsconfig
  //   if (compilerOptions.types) {
  //     const type = compilerOptions.types.find((name) =>
  //       nodeFileName.indexOf(name) !== -1,
  //     );
  //     // // declaration.moduleSpecifier
  //     // if (type) {
  //     const result = ts.resolveModuleName(
  //       nodeFileName,
  //       nodeFileName,
  //       compilerOptions,
  //       host,
  //     );
  //     // console.log('declaration', ts.SyntaxKind[declaration.kind], declaration.getText());
  //     // if (result.resolvedModule?.isExternalLibraryImport) {
  //     console.log('result', result.resolvedModule?.isExternalLibraryImport);
  //     if (result.resolvedModule?.isExternalLibraryImport) {
  //       if (node.getText() === "geese") {
  //         console.log('early exit', nodeFileName, declarationFileName,
  //           'type', type, 'for name',);
  //       }
  //       // console.log('not for', node.getText(), result.resolvedModule);
  //       return;
  //       // }
  //     }
  //   }
  // }

  let target = declaration.parent;
  while (
    target &&
    !ts.isImportDeclaration(target) &&
    !ts.isExportDeclaration(target)
  ) {
    target = target.parent;
  }
  // if (node.getText() === "geese") {
  //   console.log("import", node.parent.parent.getText(),
  //     'same file?', nodeFileName === declarationFileName, declarationFileName,
  //     ts.SyntaxKind[declaration.kind], declaration.pos, node.pos);
  // }

  if (
    !target ||
    (!ts.isImportDeclaration(target) && !ts.isExportDeclaration(target)) ||
    !target.moduleSpecifier
  ) {
    return;
  }

  const text = target.moduleSpecifier.getText().slice(1, -1) || "";

  const result = ts.resolveModuleName(
    text,
    nodeFileName,
    compilerOptions,
    host,
  );

  // Handle external imports
  if (result.resolvedModule?.isExternalLibraryImport) {
    return {
      type: "MODULE_REFERENCE",
      id: resourceManager.getId("MODULE_REFERENCE", text, node.getText()),
      import: node.getText(),
      importPath: text,
      pathId: text,
      // TODO handle packageId being empty?
      name: result.resolvedModule.packageId?.name || "",
      // TODO handle packageId being empty?
      version: result.resolvedModule.packageId?.version || "",
      isExternalLibrary: true,
      location: result.resolvedModule.resolvedFileName,
    };
  }

  // Handle build in modules
  if (text.startsWith("node:")) {
    return {
      type: "MODULE_REFERENCE",
      id: resourceManager.getId("MODULE_REFERENCE", node.getText(), text),
      import: node.getText(),
      importPath: text,
      pathId: text,
      name: text,
      isExternalLibrary: true,
      location: node.getText(),
    };
  }

  const importText =
    ts.isNamespaceImport(declaration) || ts.isImportSpecifier(declaration)
      ? declaration.getText()
      : node.getText();

  // Other module
  return {
    type: "MODULE_REFERENCE",
    id: resourceManager.getId("MODULE_REFERENCE", node.getText(), text),
    importPath: text,
    pathId: text,
    import: importText,
    name: text,
    isExternalLibrary: false,
    // TODO: Handle resolvedModule being undefined
    location: result.resolvedModule?.resolvedFileName || "",
  };
}

export function isExternalPackage(
  fileName: string,
  context: SearchContext,
): boolean {
  const { ts, program } = context;
  const compilerOptions = program.getCompilerOptions();
  const host: TsModuleResolutionHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  };

  const result = ts.resolveModuleName(
    fileName,
    fileName,
    compilerOptions,
    host,
  );

  return result.resolvedModule?.isExternalLibraryImport ?? false;
}
