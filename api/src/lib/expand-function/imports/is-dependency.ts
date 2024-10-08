const dependencyFolders = ["node_modules", ".yarn", ".pnpm"];

export function isDependency(filePath: string): boolean {
  if (!filePath) {
    return false;
  }

  // Normalize the path to handle Windows
  const normalizedPath = filePath.replace(/\\/g, "/");
  const isTypicalDependency = dependencyFolders.some((folder) =>
    normalizedPath.includes(`/${folder}/`),
  );

  if (isTypicalDependency) {
    return true;
  }

  // HACK - Handle workspace:* packages in our own monorepo
  if (normalizedPath.includes("/fpx/packages/")) {
    return true;
  }

  return false;
}
