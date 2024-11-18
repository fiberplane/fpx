/**
 * NOTE - Only works when running api with `npm run node:dev`
 */
export async function getVSCodeLinkFromCallerLocation(callerLocation: {
  file: string;
  line: string;
  column: string;
}) {
  const source = callerLocation.file.replace(/^file:\/\//, "");
  const sourceMapLocation = `${source}.map`;
  const pos = await fetchPositionFromSourceMap(
    sourceMapLocation,
    callerLocation.line,
    callerLocation.column,
  );
  const vscodeLink = `vscode://file/${pos.source}:${pos.line}:${pos.column}`;
  return vscodeLink;
}

async function fetchPositionFromSourceMap(
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
    const pos = await fetch(`/v0/source?${query.toString()}`).then((r) => {
      if (!r.ok) {
        throw new Error(
          `Failed to fetch source location from source map: ${r.status}`,
        );
      }
      return r.json();
    });
    return pos;
  } catch (err) {
    console.debug("Could not fetch source location from source map", err);
    return null;
  }
}
