import path from "node:path";
import type { TsNode, TsType, TsTypeChecker } from "./types";
import { logger } from "./logger";

/**
 * Gets the file uri to be used in the typescript language server
 *
 * If the file path is already a file:// uri, it is returned as is.
 *
 * @param filePath - The file path to get the uri for
 * @returns The file uri (file://<escapedFilePath>)
 */
export function getFileUri(filePath: string) {
  if (isFileUri(filePath)) {
    return filePath;
  }
  return `file://${escapeFilePath(filePath)}`;
}

/**
 * Escapes the file path to be used in the typescript language server
 * Necessary for Windows support
 */
function escapeFilePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

function isFileUri(uri: string) {
  return uri.startsWith("file://");
}

export function isSubpath(parentPath: string, subPath: string): boolean {
  const resolvedParentPath = path.resolve(parentPath);
  const resolvedSubPath = path.resolve(subPath);

  return resolvedSubPath.startsWith(resolvedParentPath);
}

export function debugSymbolAtLocation(
  node: TsNode,
  checker: TsTypeChecker,
  ts: TsType,
) {
  function logSymbolInfo(node: TsNode, depth: number) {
    const symbol = checker.getSymbolAtLocation(node);
    logger.log("Node Kind:", ts.SyntaxKind[node.kind]);
    // logger.log('Node Text:', node.getText());
    // logger.log('Symbol:', symbol);
    if (symbol) {
      logger.log("Symbol Name:", symbol.getName());
    }
    if (depth > 0 && node.parent) {
      logSymbolInfo(node.parent, depth - 1);
    }
  }

  logSymbolInfo(node, 8); // Adjust depth as needed
}
