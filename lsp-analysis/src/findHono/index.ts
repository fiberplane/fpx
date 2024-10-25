import type {
  RouteEntry,
  RouteTree,
  SourceReference,
  TsLanguageService,
  TsNode,
  TsProgram,
  TsReferenceEntry,
  TsSourceFile,
  TsType,
} from "../types";
import { SourceReferenceManager } from "./SourceReferenceManager";
import { createSourceReferenceForNode } from "./extractReferences";
import { findNodeAtPosition, getImportTypeDefinitionFileName } from "./utils";

export type SearchContext = {
  sourceReferenceManager: SourceReferenceManager;
  server: TsLanguageService;
  ts: TsType;
  errorCount: number;
  program: TsProgram;
  addRoute: (route: RouteTree) => void;
  getFile: (fileName: string) => TsSourceFile | undefined;
};

export function extractRouteTrees(
  server: TsLanguageService,
  ts: TsType,
): {
  errorCount?: number;
  results: Array<RouteTree>;
} {
  const sourceReferenceManager = new SourceReferenceManager();
  const program = server.getProgram();
  if (!program) {
    throw new Error("Program not found");
  }

  const apps: Array<RouteTree> = [];
  const files = program.getSourceFiles();
  const fileMap: Record<string, TsSourceFile> = {};
  for (const file of files) {
    fileMap[file.fileName] = file;
  }

  const context: SearchContext = {
    errorCount: 0,
    program,
    server,
    ts,
    sourceReferenceManager,
    addRoute: (route: RouteTree) => {
      apps.push(route);
    },
    getFile: (fileName: string) => {
      return fileMap[fileName];
    },
  };

  for (const sourceFile of files) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (file: TsSourceFile) =>
        visit(file, file.fileName, context),
      );
    }
  }

  return {
    results: apps,
    errorCount: context.errorCount,
  };
}

function visit(node: TsNode, fileName: string, context: SearchContext) {
  const { ts, program, addRoute } = context;
  const checker = program.getTypeChecker();
  if (ts.isVariableDeclaration(node) && node.initializer) {
    const type = checker.getTypeAtLocation(node.initializer);
    const typeName = checker.typeToString(type);
    if ("intrinsicName" in type && type.intrinsicName === "error") {
      context.errorCount++;
      console.error("Error in type check");
      console.error("In: ", node.getSourceFile().fileName, node.kind);
      console.error("Ndoe text:", node.getFullText());
      console.error("type information", type.getSymbol());
    }

    if (typeName.startsWith("Hono<")) {
      const honoInstanceName = node.name.getText();

      const current: RouteTree = {
        name: honoInstanceName,
        fileName: node.getSourceFile().fileName,
        entries: [],
      };

      findRoutes(current, node.parent.parent.parent, context);
      addRoute(current);
    }
  }

  ts.forEachChild(node, (child) => visit(child, fileName, context));
}

function findRoutes(
  routeTree: RouteTree,
  scope: TsNode,
  context: SearchContext,
) {
  const honoInstanceName = routeTree.name;
  const { ts, program, server, sourceReferenceManager, getFile } = context;
  function visit(node: TsNode) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const methodName = node.expression.name.getText();
      const objectName = node.expression.expression.getText();

      if (
        objectName === honoInstanceName &&
        ["put", "get", "post", "all"].includes(methodName)
      ) {
        const [firstArgument, ...args] = node.arguments;
        const entry: RouteEntry = {
          method: methodName,
          path: JSON.parse(firstArgument.getText()),
          sources: [],
        };

        // Add the tree node to the list of entries
        // Later the entry will be filled with source references
        routeTree.entries.push(entry);

        for (const arg of args) {
          if (ts.isArrowFunction(arg)) {
            const source = createSourceReferenceForNode(arg, context);
            if (source) {
              entry.sources.push(source);
            }
          } else if (ts.isCallExpression(arg)) {
            // ts.Cache
            const sourceFile = arg.getSourceFile();
            const position = sourceFile.getLineAndCharacterOfPosition(
              arg.getStart(),
            );
            const references: Array<TsReferenceEntry> | undefined =
              server.getReferencesAtPosition(
                sourceFile.fileName,
                arg.getStart(),
              ) || [];

            const source: SourceReference = {
              character: position.character,
              line: position.line,
              fileName: sourceFile.fileName,
              content: arg.getText(),
              references: [],
              modules: {},
            };
            sourceReferenceManager.addReference(
              source.fileName,
              arg.getStart(),
              source,
            );
            // Immediately add the source to the entry
            // Though the source will be filled with references later
            entry.sources.push(source);

            let ref: TsReferenceEntry | undefined = references.shift();
            while (ref) {
              const currentFile = getFile(ref.fileName);
              if (!currentFile) {
                console.log("no file found", ref.fileName);
                continue;
              }

              const refNode = findNodeAtPosition(
                ts,
                currentFile,
                ref.textSpan.start,
              );
              const moduleResult = getImportTypeDefinitionFileName(
                refNode,
                context,
              );

              if (moduleResult) {
                const { isExternalLibrary, location, ...dependency } =
                  moduleResult;
                if (isExternalLibrary) {
                  context.sourceReferenceManager.addModuleToReference(
                    sourceFile.fileName,
                    arg.getStart(),
                    dependency,
                  );
                }

                break;
              }

              ref = references.shift();
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(scope, visit);
}
