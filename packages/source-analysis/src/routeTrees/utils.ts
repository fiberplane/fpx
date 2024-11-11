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

  const nodeFileName = node.getSourceFile().fileName;
  const compilerOptions = program.getCompilerOptions();
  const host: TsModuleResolutionHost = {
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
  };

  if (!declaration) {
    console.warn("No declaration found for symbol", symbol);
    return;
  }

  let target: TsNode | undefined = declaration.parent;

  // Walk up to the import/export declaration
  while (
    target &&
    !ts.isImportDeclaration(target) &&
    !ts.isExportDeclaration(target)
  ) {
    target = target.parent;
  }

  if (!target || !target.moduleSpecifier) {
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
      // This could happen when dealing with Non-NPM packages
      // or perhaps when it is a built-in module, but in my local
      // testing, the lookup seems to fail for built-in modules
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
