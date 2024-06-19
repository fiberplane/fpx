import { Fragment } from "react";

export function StackTrace({ stackTrace }: { stackTrace: string }) {
  const lines = stackTrace.split("\n");

  return lines.map((line, index) => {
    const match = line.match(
      /at(( ?<method>[\w\.]* \()?| )(?<file>.*):(?<lineNumber>\d+):(?<columnNumber>\d+)(\))?$/,
    );
    if (!match || !match.groups) {
      return (
        <Fragment key={index}>
          {line}
          {"\n"}
        </Fragment>
      );
    }

    const { method, file, lineNumber, columnNumber } = match.groups;

    if (file) {
      console.log(match.groups);
      return (
        <Fragment key={index}>
          {extractIndentation(line)}
          <a
            className="text-blue-500 hover:underline"
            href={`vscode://${file.trim()}:${lineNumber}:${columnNumber}`}
          >
            {method
              ? `${method.trim()} (${file}:${lineNumber}:${columnNumber})`
              : `${file.trim()}:${lineNumber}:${columnNumber}`}
          </a>
          {"\n"}
        </Fragment>
      );
    }
    return (
      <Fragment key={index}>
        {line}
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
