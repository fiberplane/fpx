type Diffs = Array<[string | undefined, string | undefined]>;

export function diffPaths(oldPath: string, newPath: string) {
  const oldPathParts = oldPath.split("/");
  const newPathParts = newPath.split("/");

  const diffParts: Array<[string | undefined, string | undefined]> = [];

  for (let i = 0; i < oldPathParts.length; i++) {
    if (oldPathParts[i] !== newPathParts[i]) {
      diffParts.push([oldPathParts[i], newPathParts[i]]);
    }
  }

  if (newPathParts.length > oldPathParts.length) {
    for (let i = oldPathParts.length; i < newPathParts.length; i++) {
      diffParts.push([undefined, newPathParts[i]]);
    }
  }

  return diffParts;
}

/**
 * Returns true if there's only one diff, AND the previous path segment was a path parameter
 */
export function hasChangedPathParam(diffs: Diffs) {
  return diffs.length === 1 && !!diffs[0][0]?.startsWith(":");
}
