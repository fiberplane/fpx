import { Fragment } from "react";

export function StackTrace({ stackTrace }: { stackTrace: string }) {
  const lines = stackTrace.split("\n");

  return lines.map((line, index) => {
    const regex =
      /at (?:(?<method>[^\s]+) \()?file:\/\/(?<file>[^\s]+):(?<lineNumber>\d+):(?<columnNumber>\d+)\)?/;

    const match = line.match(regex);
    if (!match || !match.groups) {
      return (
        <Fragment key={index}>
          {line}
          {"\n"}
        </Fragment>
      );
    }

    const { method, file, lineNumber, columnNumber } = match.groups;
    return (
      <Fragment key={index}>
        {extractIndentation(line)}
        at {method ? `${method.trim()} (` : ""}
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={`vscode://${file.trim()}:${lineNumber}:${columnNumber}`}
        >
          {file.trim()}:{lineNumber}:{columnNumber}
        </a>
        {method && ")"}
        {"\n"}
      </Fragment>
    );
  });
}

function extractIndentation(source: string) {
  // Regular expression to match leading whitespace (spaces or tabs)
  const match = source.match(/^\s*/);

  // Extract the matched indentation
  const indentation = match ? match[0] : "";
  return indentation;
}
