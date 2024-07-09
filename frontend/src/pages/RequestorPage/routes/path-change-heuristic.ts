import { diffPaths, hasChangedPathParam } from "./diff-paths";

/**
 * Hacky, temporary heuristic to prevent the selected route in the side-bar
 * from being deselected in certain cases
 *
 * @param oldPath - Should be the currently selected route's path, possibly with path parameters
 * @param newPath
 */
export function shouldDeselectRoute(oldPath: string, newPath: string) {
  const segmentDiffs = diffPaths(oldPath, newPath);

  // Nothing changed, so don't change the curretly selected route
  if (segmentDiffs.length === 0) {
    return false;
  }

  // E.g., `/users/:id` -> `/users/` should still keep the same route selected from the side bar
  if (segmentDiffs.length === 1) {
    const [oldPart, newPart] = segmentDiffs[0];
    if (oldPart && newPart === "") {
      return false;
    }
  }

  // If only one segment changed, and that segment was a path parameter
  // we *might* be able to get away with not deselecting the route
  if (hasChangedPathParam(segmentDiffs)) {
    const [oldPart, newPart] = segmentDiffs[0];

    // If the new part is an empty string, it's possible the user is removing then adding a new path param
    // NOTE - if the newPart is undefined, we assume they're just editing the path entirely
    if (newPart === "") {
      return false;
    }
    if (newPart && oldPart?.includes(newPart)) {
      return false;
    }
    if (newPart && !newPart.startsWith(":")) {
      return false;
    }
  }

  return true;
}
