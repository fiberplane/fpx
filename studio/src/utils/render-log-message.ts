/**
 * Try to render a string the way that the console.* methods would.
 *
 * I.e., render all arguments as a string.
 *
 * This needs improvement
 */
export function renderFullLogMessage(allLogArgs: Array<unknown>) {
  return allLogArgs.reduce((result, curr) => {
    if (Array.isArray(curr) || (result && typeof result === "object")) {
      return `${result} ${JSON.stringify(curr)}`;
    }

    return `${result} ${curr}`;
  }, "" as string) as string;
}
