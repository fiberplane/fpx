import path from "node:path";
/**
 * Gets the file uri to be used in the typescript language server
 *
 * If the file path is already a file:// uri, it is returned as is.
 *
 * @param filePath - The file path to get the uri for
 * @returns The file uri (file://<escapedFilePath>)
 */
export function getFileUri(filePath) {
    if (isFileUri(filePath)) {
        return filePath;
    }
    return `file://${escapeFilePath(filePath)}`;
}
/**
 * Escapes the file path to be used in the typescript language server
 * Necessary for Windows support
 */
function escapeFilePath(filePath) {
    return filePath.replace(/\\/g, "/");
}
function isFileUri(uri) {
    return uri.startsWith("file://");
}
export function isSubpath(parentPath, subPath) {
    const resolvedParentPath = path.resolve(parentPath);
    const resolvedSubPath = path.resolve(subPath);
    return resolvedSubPath.startsWith(resolvedParentPath);
}
export function debugSymbolAtLocation(node, checker, ts) {
    function logSymbolInfo(node, depth) {
        const symbol = checker.getSymbolAtLocation(node);
        console.log("Node Kind:", ts.SyntaxKind[node.kind]);
        // console.log('Node Text:', node.getText());
        // console.log('Symbol:', symbol);
        if (symbol) {
            console.log("Symbol Name:", symbol.getName());
        }
        if (depth > 0 && node.parent) {
            logSymbolInfo(node.parent, depth - 1);
        }
    }
    logSymbolInfo(node, 8); // Adjust depth as needed
}
