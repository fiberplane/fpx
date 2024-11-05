import { ResourceManager } from "../ResourceManager";
import { HONO_HTTP_METHODS, } from "../types";
import { createSourceReferenceForNode } from "./extractReferences";
import { findNodeAtPosition } from "./utils";
export function extractRouteTrees(service, ts, projectRoot) {
    const program = service.getProgram();
    if (!program) {
        throw new Error("Program not found");
    }
    const resourceManager = new ResourceManager(projectRoot);
    const checker = program.getTypeChecker();
    const files = program.getSourceFiles();
    const fileMap = {};
    for (const file of files) {
        fileMap[file.fileName] = file;
    }
    const asRelativePath = (absolutePath) => resourceManager.asRelativePath(absolutePath);
    const asAbsolutePath = (relativePath) => resourceManager.asAbsolutePath(relativePath);
    const context = {
        errorCount: 0,
        program,
        service,
        checker,
        ts,
        resourceManager,
        getFile: (fileName) => {
            return fileMap[fileName];
        },
        asRelativePath,
        asAbsolutePath,
    };
    for (const sourceFile of files) {
        if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, (node) => {
                visit(node, sourceFile.fileName, context);
            });
        }
    }
    return {
        resourceManager,
        errorCount: context.errorCount,
    };
}
function visit(node, fileName, context) {
    const { ts, checker, asRelativePath, resourceManager, service } = context;
    if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
            // Check if the variable is of type Hono
            const type = checker.getTypeAtLocation(declaration.initializer || declaration);
            const typeName = checker.typeToString(type);
            if ("intrinsicName" in type && type.intrinsicName === "error") {
                context.errorCount++;
                console.error("Error in type check");
                console.error("In: ", node.getSourceFile().fileName, node.kind);
                console.error("Node text:", node.getFullText());
                console.error("type information", type.getSymbol());
            }
            if (typeName.startsWith("Hono<")) {
                // TODO: use the type information to get the name of the hono instance
                // TODO: (edge case) handle reassignments of the same variable. It's possible reuse a variable for different hono instances
                const honoInstanceName = declaration.name.getText();
                const position = declaration.name.getStart();
                const params = {
                    type: "ROUTE_TREE",
                    baseUrl: "",
                    name: honoInstanceName,
                    fileName: asRelativePath(node.getSourceFile().fileName),
                    position,
                    entries: [],
                };
                const current = resourceManager.createRouteTree(params);
                // TODO: add support for late initialization of the hono instance
                // What if people do something like:
                //
                // ``` ts
                // let app: Hono;
                // app = new Hono();
                // ```
                //
                // Or have some other kind of initialization:
                //
                // ``` ts
                // let app: Hono;
                // app = createApp();
                // ```
                if (declaration.initializer &&
                    ts.isCallExpression(declaration.initializer)) {
                    handleInitializerCallExpression(declaration.initializer, current, context);
                }
                const references = (service.getReferencesAtPosition(fileName, position) ?? []).filter((reference) => reference.fileName === fileName &&
                    reference.textSpan.start !== position);
                for (const entry of references) {
                    followReference(current, entry, context);
                }
            }
        }
    }
}
function handleInitializerCallExpression(callExpression, routeTree, context) {
    const { ts, getFile, asRelativePath, resourceManager, program } = context;
    const fileName = callExpression.getSourceFile().fileName;
    const references = context.service.findReferences(fileName, callExpression.getStart());
    const reference = references?.find((ref) => ref.definition.kind === ts.ScriptElementKind.functionElement);
    if (!reference) {
        console.warn("no reference found for", callExpression.getText());
        return;
    }
    const declarationFileName = reference.definition.fileName;
    const targetSourceFile = getFile(declarationFileName) || program.getSourceFile(declarationFileName);
    const functionNode = targetSourceFile &&
        findNodeAtPosition(ts, targetSourceFile, reference.definition.textSpan.start);
    if (functionNode?.parent &&
        ts.isFunctionDeclaration(functionNode.parent) &&
        functionNode.parent.body) {
        const functionBody = functionNode.parent.body;
        functionBody.forEachChild((child) => {
            visit(child, declarationFileName, context);
        });
        // Now find the return statements in the function body to construct the route tree reference
        const returnStatements = findReturnStatementsInFunction(functionNode.parent, context);
        const variables = returnStatements.flatMap((returnStatement) => analyzeReturnStatement(returnStatement, context));
        for (const variable of variables) {
            const variableFileName = variable.getSourceFile().fileName;
            const variablePosition = variable.getStart();
            const params = {
                type: "ROUTE_TREE_REFERENCE",
                targetId: resourceManager.getId("ROUTE_TREE", variableFileName, variablePosition),
                fileName: asRelativePath(variableFileName),
                position: variablePosition,
                name: variable.name.getText(),
                path: "/",
            };
            const { id } = resourceManager.createRouteTreeReference(params);
            routeTree.entries.push(id);
        }
    }
}
function followReference(routeTree, reference, context) {
    const { getFile, ts } = context;
    const sourceFile = getFile(reference.fileName);
    if (!sourceFile) {
        console.warn("no file found", reference.fileName);
        return;
    }
    const node = findNodeAtPosition(ts, sourceFile, reference.textSpan.start);
    if (!node) {
        console.warn("no node found", reference.textSpan.start);
        return;
    }
    const accessExpression = node.parent;
    const callExpression = node.parent?.parent;
    if (accessExpression &&
        ts.isPropertyAccessExpression(accessExpression) &&
        callExpression &&
        ts.isCallExpression(callExpression)) {
        const methodName = accessExpression.name.text;
        handleHonoMethodCall(callExpression, methodName, routeTree, context);
    }
}
function handleHonoMethodCall(callExpression, methodName, routeTree, context) {
    const { ts, resourceManager } = context;
    if (methodName === "route") {
        return handleRoute(callExpression, routeTree, context);
    }
    if (methodName === "use") {
        return handleUse(callExpression, routeTree, context);
    }
    if (methodName === "baseUrl") {
        if (ts.isStringLiteral(callExpression.arguments[0])) {
            routeTree.baseUrl = callExpression.arguments[0].text;
        }
    }
    if ([...HONO_HTTP_METHODS, "all", "use"].includes(methodName)) {
        const [firstArgument, ...args] = callExpression.arguments;
        const params = {
            type: "ROUTE_ENTRY",
            fileName: callExpression.getSourceFile().fileName,
            position: callExpression.getStart(),
            method: methodName === "all" ? undefined : methodName,
            path: JSON.parse(firstArgument.getText()),
            modules: [],
            sources: [],
        };
        const entry = resourceManager.createRouteEntry(params);
        // Add the tree node to the list of entries
        // Later the entry will be filled with source references
        routeTree.entries.push(entry.id);
        for (const arg of args) {
            if (ts.isArrowFunction(arg) || ts.isCallExpression(arg)) {
                const source = createSourceReferenceForNode(arg, context);
                if (source) {
                    entry.sources.push(source.id);
                }
            }
        }
    }
}
function handleRoute(callExpression, routeTree, context) {
    const { ts, getFile, asRelativePath, resourceManager, checker, service } = context;
    // There should be 2 arguments
    const [firstArgument = undefined, appNode = undefined] = callExpression.arguments;
    if (!appNode) {
        return;
    }
    const path = firstArgument && ts.isStringLiteral(firstArgument)
        ? firstArgument.text
        : "";
    const SUPPORTED_VARIABLE_KINDS = [
        ts.ScriptElementKind.constElement,
        ts.ScriptElementKind.letElement,
        ts.ScriptElementKind.variableElement,
    ];
    let target;
    const symbol = checker.getSymbolAtLocation(appNode);
    const declaration = symbol?.declarations?.[0];
    if (declaration && ts.isVariableDeclaration(declaration)) {
        target = declaration;
    }
    if (!target) {
        if (symbol && isAlias(symbol, context)) {
            let alias = symbol;
            while (alias && isAlias(alias, context)) {
                alias = checker.getAliasedSymbol(symbol);
                if (alias.valueDeclaration &&
                    ts.isVariableDeclaration(alias.valueDeclaration)) {
                    target = alias.valueDeclaration;
                }
            }
        }
    }
    if (!target) {
        console.log("No target found for", appNode.getText());
        return;
    }
    const filename = target.getSourceFile().fileName;
    const position = target.getStart();
    const targetId = resourceManager.getId("ROUTE_TREE", filename, target.getStart());
    const params = {
        type: "ROUTE_TREE_REFERENCE",
        targetId,
        fileName: asRelativePath(filename),
        position,
        name: target.name.getText(),
        path,
    };
    const { id } = resourceManager.createRouteTreeReference(params);
    routeTree.entries.push(id);
}
function extractPathFromUseArguments(callExpressionArgs, context) {
    if (callExpressionArgs.length === 0) {
        return "/";
    }
    const { ts } = context;
    const [firstArgument] = callExpressionArgs;
    if (ts.isStringLiteral(firstArgument)) {
        return firstArgument.text;
    }
    return "/";
}
function isPossibleMiddleware(node, context) {
    const { ts } = context;
    return (ts.isArrowFunction(node) ||
        ts.isCallExpression(node) ||
        ts.isFunctionDeclaration(node));
}
function extractAppsFromUseArguments(callExpressionArgs, context) {
    return callExpressionArgs.filter((arg) => isPossibleMiddleware(arg, context));
}
function handleUse(callExpression, routeTree, context) {
    const { resourceManager } = context;
    const path = extractPathFromUseArguments(callExpression.arguments, context);
    const middleware = extractAppsFromUseArguments(callExpression.arguments, context);
    const params = {
        type: "MIDDLEWARE_ENTRY",
        path,
        modules: [],
        sources: [],
        fileName: callExpression.getSourceFile().fileName,
        position: callExpression.getStart(),
    };
    const entry = resourceManager.createMiddlewareEntry(params);
    routeTree.entries.push(entry.id);
    for (const arg of middleware) {
        const source = createSourceReferenceForNode(arg, context);
        if (source) {
            entry.sources.push(source.id);
        }
    }
}
function findReturnStatementsInFunction(node, context) {
    const { ts } = context;
    const returnStatements = [];
    function visit(node) {
        if (ts.isReturnStatement(node)) {
            returnStatements.push(node);
        }
        ts.forEachChild(node, visit);
    }
    if (node.body) {
        visit(node.body);
    }
    return returnStatements;
}
function analyzeReturnStatement(returnStatement, context) {
    const { checker, ts } = context;
    const variables = [];
    function visit(node) {
        if (ts.isIdentifier(node)) {
            const symbol = checker.getSymbolAtLocation(node);
            const declaration = symbol?.declarations?.[0];
            // console.log('declaration', declaration && ts.SyntaxKind[declaration.kind])
            if (declaration && ts.isVariableDeclaration(declaration)) {
                variables.push(declaration);
            }
        }
        ts.forEachChild(node, visit);
    }
    if (returnStatement.expression) {
        visit(returnStatement.expression);
    }
    return variables;
}
function isAlias(symbol, context) {
    return symbol.flags === context.ts.SymbolFlags.Alias;
}
