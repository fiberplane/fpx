/**
 * Try to render a string the way that the console.* methods would.
 *
 * I.e., render all arguments as a string.
 *
 * This needs improvement
 */
export function renderFullLogMessage(allLogArgs: Array<unknown>) {
  console.log("allLogArgs", allLogArgs);
  return allLogArgs.reduce((result, curr) => {
    console.log("result", result, "curr", curr);
    if (Array.isArray(curr) || (curr && typeof curr === "object")) {
      return `${result} ${JSON.stringify(curr)}`;
    }

    return `${result} ${curr}`;
  }, "" as string) as string;
}
