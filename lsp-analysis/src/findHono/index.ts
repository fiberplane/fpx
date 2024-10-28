import { symbol } from "zod";
import type {
  RouteEntry,
  RouteTree,
  SourceReference,
  TsCallExpression,
  TsLanguageService,
  TsNode,
  TsProgram,
  TsReferenceEntry,
  TsSourceFile,
  TsSymbol,
  TsType,
  TsTypeChecker,
  TsVariableDeclaration,
} from "../types";
import { SourceReferenceManager } from "./SourceReferenceManager";
import { createSourceReferenceForNode } from "./extractReferences";
import { findNodeAtPosition, getImportTypeDefinitionFileName } from "./utils";

export type SearchContext = {
  sourceReferenceManager: SourceReferenceManager;
  service: TsLanguageService;
  ts: TsType;
  errorCount: number;
  program: TsProgram;
  checker: TsTypeChecker;
  addRouteTree: (route: RouteTree) => void;
  getFile: (fileName: string) => TsSourceFile | undefined;
};

export function extractRouteTrees(
  service: TsLanguageService,
  ts: TsType,
): {
  errorCount?: number;
  results: Array<RouteTree>;
} {
  const sourceReferenceManager = new SourceReferenceManager();
  const program = service.getProgram();
  const checker = program.getTypeChecker();
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
    service,
    checker,
    ts,
    sourceReferenceManager,
    addRouteTree: (route: RouteTree) => {
      apps.push(route);
    },
    getFile: (fileName: string) => {
      return fileMap[fileName];
    },
  };

  for (const sourceFile of files) {
    if (!sourceFile.isDeclarationFile) {
      ts.forEachChild(sourceFile, (node: TsNode) => {
        visit(node, sourceFile.fileName, context);
      });
    }
  }

  return {
    results: apps,
    errorCount: context.errorCount,
  };
}

// function debugSymbolAtLocation(node: TsNode, checker: TsTypeChecker, ts: TsType) {
//   function logSymbolInfo(node: TsNode, depth: number) {
//     const symbol = checker.getSymbolAtLocation(node);
//     console.log('Node Kind:', ts.SyntaxKind[node.kind]);
//     // console.log('Node Text:', node.getText());
//     // console.log('Symbol:', symbol);
//     if (symbol) {
//       console.log('Symbol Name:', symbol.getName());
//     }
//     if (depth > 0 && node.parent) {
//       logSymbolInfo(node.parent, depth - 1);
//     }
//   }

//   logSymbolInfo(node, 8); // Adjust depth as needed
// }

function visit(node: TsNode, fileName: string, context: SearchContext) {
  const { ts, addRouteTree, checker } = context;

  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      if (
        declaration.initializer &&
        ts.isNewExpression(declaration.initializer)
      ) {
        const type = checker.getTypeAtLocation(declaration.initializer);
        const typeName = checker.typeToString(type);
        if ("intrinsicName" in type && type.intrinsicName === "error") {
          context.errorCount++;
          console.error("Error in type check");
          console.error("In: ", node.getSourceFile().fileName, node.kind);
          console.error("Node text:", node.getFullText());
          console.error("type information", type.getSymbol());
        }

        // TODO: we may want to make this more robust
        // This is a very simple check to see if the type is a Hono instance
        if (typeName.startsWith("Hono<")) {
          const honoInstanceName = declaration.name.getText();

          const current: RouteTree = {
            name: honoInstanceName,
            fileName: node.getSourceFile().fileName,
            entries: [],
          };

          // Add route early
          addRouteTree(current);

          // TODO allow for multiples from different files;
          const references = context.service
            .getReferencesAtPosition(fileName, declaration.name.getStart())
            .filter(
              (reference) =>
                reference.fileName === fileName &&
                reference.textSpan.start !== declaration.name.getStart(),
            );
          for (const entry of references) {
            followReference(current, entry, context);
          }
        }
      }
    }
  }
}

function followReference(
  routeTree: RouteTree,
  reference: TsReferenceEntry,
  context: SearchContext,
) {
  const { getFile, ts } = context;

  const sourceFile = getFile(reference.fileName);
  if (!sourceFile) {
    console.error("no file found", reference.fileName);
    return;
  }

  const node = findNodeAtPosition(ts, sourceFile, reference.textSpan.start);
  if (!node) {
    console.error("no node found", reference.textSpan.start);
    return;
  }

  const accessExpression = node.parent;
  const callExpression = node.parent.parent;
  if (
    accessExpression &&
    ts.isPropertyAccessExpression(accessExpression) &&
    callExpression &&
    ts.isCallExpression(callExpression)
  ) {
    const nameNode = accessExpression.name;
    const methodName = nameNode.getText();

    if (["put", "get", "post", "all"].includes(methodName)) {
      const [firstArgument, ...args] = callExpression.arguments;
      const entry: RouteEntry = {
        type: "ROUTE_ENTRY",
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

          // Skip the rest of the loop
          continue;
        }

        if (ts.isCallExpression(arg)) {
          handleCallExpression(arg, entry, context);
        }
      }
    }
    if (methodName === "route") {
      const [firstArgument = undefined, appNode = undefined] =
        callExpression.arguments;
      const path = ts.isStringLiteral(firstArgument) ? firstArgument.text : "";
      if (appNode) {
        const variableKinds = [
          ts.ScriptElementKind.constElement,
          ts.ScriptElementKind.letElement,
          ts.ScriptElementKind.variableElement,
        ];
        const references = context.service.findReferences(
          appNode.getSourceFile().fileName,
          appNode.getStart(),
        );

        let target: TsVariableDeclaration | undefined;
        for (const referencedSymbol of references) {
          // Check if it's a variable like const, let or var
          if (variableKinds.includes(referencedSymbol.definition.kind)) {
            // If so, find the node
            const variableDeclarationChild = findNodeAtPosition(
              ts,
              getFile(referencedSymbol.definition.fileName),
              referencedSymbol.definition.textSpan.start,
            );
            // Access the parent & verify that's a variable declaration
            // As the node will point to the identifier and not the declaration
            if (
              variableDeclarationChild?.parent &&
              ts.isVariableDeclaration(variableDeclarationChild.parent)
            ) {
              target = variableDeclarationChild.parent;
              break;
            }
          }
        }

        if (!target) {
          return;
        }

        routeTree.entries.push({
          type: "ROUTE_TREE_REFERENCE",
          filename: target.getSourceFile().fileName,
          name: target.name.getText(),
          path,
        });
      }
    }
  }
}

function handleCallExpression(
  arg: TsCallExpression,
  entry: RouteEntry,
  context: SearchContext,
) {
  const { service, sourceReferenceManager, getFile, ts } = context;
  const sourceFile = arg.getSourceFile();
  const position = sourceFile.getLineAndCharacterOfPosition(arg.getStart());
  const references: Array<TsReferenceEntry> | undefined =
    service.getReferencesAtPosition(sourceFile.fileName, arg.getStart()) || [];

  const source: SourceReference = {
    character: position.character,
    line: position.line,
    fileName: sourceFile.fileName,
    content: arg.getText(),
    references: [],
    modules: {},
  };

  sourceReferenceManager.addReference(source.fileName, arg.getStart(), source);

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

    const refNode = findNodeAtPosition(ts, currentFile, ref.textSpan.start);
    const moduleResult = getImportTypeDefinitionFileName(refNode, context);

    if (moduleResult) {
      const { isExternalLibrary, location, ...dependency } = moduleResult;
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
