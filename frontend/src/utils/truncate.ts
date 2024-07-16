export function truncateWithEllipsis(path: string | null | undefined, maxLength = 50) {
  if (path === null || path === undefined) {
    return null;
  }
  return path.length > maxLength ? `${path.slice(0, maxLength)}...` : path;
}
