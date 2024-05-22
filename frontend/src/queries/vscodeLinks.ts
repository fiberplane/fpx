/**
 * NOTE - Only works when running api with `npm run node:dev`
 */
export async function getVSCodeLink(errorDetails: { stack: string }) {
  const position = parseStackTrace(errorDetails.stack);
  if (!position) {
    console.error("NO POSITION FOUND IN STACK TRACE", errorDetails.stack);
    return null;
  }

  const sourceMapLocation = `${position.source}.map`;
  console.log('hi', sourceMapLocation);
  const query = new URLSearchParams({
    source: sourceMapLocation,
    line: position.line.toString(),
    column: position.column.toString()
  });
  const querystring = query.toString();
  console.log('querystring', querystring)
  const pos = await fetch(`http://localhost:8788/v0/source?${query.toString()}`).then(r => r.json());
  const vscodeLink = `vscode://file/${pos.source}:${pos.line}:${pos.column}`;
  return vscodeLink;
}

function parseStackTrace(stack: string) {
  // Regular expression to match the pattern "file://path:line:column"
  const regex = /file:\/\/(\/[\w\-. /]+):(\d+):(\d+)/;

  // Attempt to match the regex pattern against the provided stack trace
  const match = stack.match(regex);

  if (match) {
    // Extract the file path, line, and column from the regex match
    const [, source, line, column] = match;
    return {
      source,
      line: parseInt(line, 10),
      column: parseInt(column, 10)
    };
  } else {
    // Return null or throw an error if no match is found
    return null;
  }
}