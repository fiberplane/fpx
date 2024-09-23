/**
 * Gets the file uri to be used in the typescript language server
 * @param filePath - The file path to get the uri for
 * @returns The file uri (file://<escapedFilePath>)
 */
export function getFileUri(filePath: string) {
  return `file://${escapeFilePath(filePath)}`;
}

/**
 * Escapes the file path to be used in the typescript language server
 * Necessary for windows support
 */
export function escapeFilePath(filePath: string) {
  return filePath.replace(/\\/g, "/");
}

export function isFileUri(uri: string) {
  return uri.startsWith("file://");
}
