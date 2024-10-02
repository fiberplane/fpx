/**
 * NOTE - Only works when running api with `npm run node:dev`
 */
export async function getVSCodeLinkFromError(
  apiBaseUrl: string,
  errorDetails: { stack: string },
) {
  // TODO - Skip `neon`?
  const position = parseStackTrace(errorDetails.stack);
  if (!position) {
    console.error("NO POSITION FOUND IN STACK TRACE", errorDetails.stack);
    return null;
  }

  const sourceMapLocation = `${position.source}.map`;
  const line = position.line.toString();
  const column = position.column.toString();

  const pos = await fetchPositionFromSourceMap(
    apiBaseUrl,
    sourceMapLocation,
    line,
    column,
  );

  const vscodeLink = `vscode://file/${pos.source}:${pos.line}:${pos.column}`;
  return vscodeLink;
}

/**
 * NOTE - Only works when running api with `npm run node:dev`
 */
export async function getVSCodeLinkFromCallerLocation(
  apiBaseUrl: string,
  callerLocation: {
    file: string;
    line: string;
    column: string;
  },
) {
  const source = callerLocation.file.replace(/^file:\/\//, "");
  const sourceMapLocation = `${source}.map`;
  const pos = await fetchPositionFromSourceMap(
    apiBaseUrl,
    sourceMapLocation,
    callerLocation.line,
    callerLocation.column,
  );
  const vscodeLink = `vscode://file/${pos.source}:${pos.line}:${pos.column}`;
  return vscodeLink;
}

async function fetchPositionFromSourceMap(
  apiBaseUrl: string,
  sourceMapLocation: string,
  line: string,
  column: string,
) {
  const query = new URLSearchParams({
    source: sourceMapLocation,
    line: line,
    column: column,
  });
  try {
    const pos = await fetch(`${apiBaseUrl}/v0/source?${query.toString()}`).then(
      (r) => {
        if (!r.ok) {
          throw new Error(
            `Failed to fetch source location from source map: ${r.status}`,
          );
        }
        return r.json();
      },
    );
    return pos;
  } catch (err) {
    console.debug("Could not fetch source location from source map", err);
    return null;
  }
}

function parseStackTrace(stack: string) {
  // Regular expression to match the pattern "file://path:line:column"
  const regex = /file:\/\/(\/[\w\-. /]+):(\d+):(\d+)/;
  // TODO - skip `neon` when looking for match - could not get this regex to work
  // const regex = /at (?!(neon\b))[^(\n]+ \(?(file:\/\/[^:]+):(\d+):(\d+)\)?/;
  const stackLines = stack
    .split("\n")
    .filter((l) => /^\s+at/.test(l))
    .map((l) => l.trim())
    .filter((l) => !l.startsWith("at neon"));

  // Attempt to match the regex pattern against the provided stack trace
  let match: RegExpMatchArray | null = null;
  for (const stack of stackLines) {
    match = stack.match(regex);
    if (match) {
      break;
    }
  }

  if (match) {
    // if (stack.includes("neon")) {
    //   debugger
    // }
    // Extract the file path, line, and column from the regex match
    const [, source, line, column] = match;
    return {
      source,
      line: Number.parseInt(line, 10),
      column: Number.parseInt(column, 10),
    };
  }

  // Return null or throw an error if no match is found
  return null;
}
