/**
 * Try to render a string the way that the console.* methods would.
 *
 * I.e., render all arguments as a string.
 *
 * This needs improvement
 */
export function renderFullLogMessage(allLogArgs: Array<unknown>) {
  return allLogArgs
    .map((arg) => {
      if (Array.isArray(arg) || (arg && typeof arg === "object")) {
        return JSON.stringify(arg);
      }

      return `${arg}`;
    })
    .join(" ");
}
