export function getFileUri(filePath: string) {
  return `file://${filePath.replace(/\\/g, "/")}`;
}
