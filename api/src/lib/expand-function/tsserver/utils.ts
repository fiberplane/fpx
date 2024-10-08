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
