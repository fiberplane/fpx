const dependencyFolders = ["node_modules", ".yarn", ".pnpm"];

export function isDependency(filePath: string): boolean {
  if (!filePath) {
    return false;
  }

  // Normalize the path to handle Windows
  const normalizedPath = filePath.replace(/\\/g, "/");
  return dependencyFolders.some((folder) =>
    normalizedPath.includes(`/${folder}/`),
  );
}
