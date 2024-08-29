/**
 * Try to render a string the way that the console.* methods would.
 *
 * I.e., render all arguments as a string.
 *
 * This needs improvement
 */
export function renderFullLogMessage(allLogArgs: Array<unknown>) {
  return allLogArgs.reduce((result: string, curr): string => {
    console.log('result', result.length, 'curr', curr);
    if (Array.isArray(curr) || (curr && typeof curr === "object")) {
      return `${result}${result.length > 0 ? " " : ""}${JSON.stringify(curr)}`;
    }

    return `${result}${result.length > 0 ? " " : ""}${curr}`;
  }, "");
}
