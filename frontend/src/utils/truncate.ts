export function truncateWithEllipsis(path: string | null, maxLength = 50) {
  if (path === null) {
    return null;
  }
  return path.length > maxLength ? `${path.slice(0, maxLength)}...` : path;
}
