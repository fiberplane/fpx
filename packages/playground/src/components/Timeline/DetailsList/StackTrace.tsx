import { Fragment } from "react";

export function StackTrace({ stackTrace }: { stackTrace: string }) {
  const lines = stackTrace.split("\n");

  return (
    <pre className="font-mono p-1">
      <code>
        {lines.map((line, index) => {
          const fileLocationMatch =
            /file:\/\/(?<file>[^\s]+):(?<lineNumber>\d+):(?<columnNumber>\d+)/;
          const match = line.match(fileLocationMatch);
          if (!match || !match.groups) {
            return (
              <Fragment key={index}>
                {line}
                {"\n"}
              </Fragment>
            );
          }

          const { file, lineNumber, columnNumber } = match.groups;
          const methodMatch = line.match(
            /at (?<method>(async )?[\w [\].<>]+) (\()?file:\/\//,
          );
          const method = methodMatch?.groups?.method;
          return (
            <Fragment key={index}>
              {extractIndentation(line)}
              at {method ? `${method.trim()} (` : ""}
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={`vscode://file/${file.trim()}:${lineNumber}:${columnNumber}`}
              >
                {file.trim()}:{lineNumber}:{columnNumber}
              </a>
              {method && ")"}
              {"\n"}
            </Fragment>
          );
        })}
      </code>
    </pre>
  );
}

function extractIndentation(source: string) {
  // Regular expression to match leading whitespace (spaces or tabs)
  const match = source.match(/^\s*/);

  // Extract the matched indentation
  const indentation = match ? match[0] : "";
  return indentation;
}
