import {
  type RouteEntry,
  type TsVariableDeclaration,
  type RouteTree,
  type SearchContext,
  type TsCallExpression,
  type TsLanguageService,
  type TsNode,
  type TsReferenceEntry,
  type TsSourceFile,
  type TsType,
  HONO_HTTP_METHODS,
} from "../types";
import { createSourceReferenceForNode } from "./extractReferences";
import { SourceReferenceManager } from "../SourceReferenceManager";
import { findNodeAtPosition } from "./utils";

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

function visit(node: TsNode, fileName: string, context: SearchContext) {
  const { ts, addRouteTree, checker } = context;

  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      if (declaration.initializer) {
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

    handleHonoMethodCall(callExpression, nameNode.text, routeTree, context);
  }
}

function handleHonoMethodCall(
  callExpression: TsCallExpression,
  methodName: string,
  routeTree: RouteTree,
  context: SearchContext,
) {
  const { ts, getFile } = context;

  if ([...HONO_HTTP_METHODS, "all", "use"].includes(methodName)) {
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
      if (ts.isArrowFunction(arg) ||
        ts.isCallExpression(arg)
      ) {
        const source = createSourceReferenceForNode(arg, context);
        if (source) {
          entry.sources.push(source);
        }
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
