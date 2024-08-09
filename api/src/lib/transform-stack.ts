import { readFile } from "node:fs/promises";
import { SourceMapConsumer } from "source-map";

export async function transformStack(stack: string) {
  const lines = stack.split("\n");

  const parsedLines = await Promise.all(
    lines.map(async (line) => {
      const fileLocationMatch =
        /file:\/\/(?<file>[^\s]+):(?<lineNumber>\d+):(?<columnNumber>\d+)/;
      const match = line.match(fileLocationMatch);
      if (!match || !match.groups) {
        return line;
      }

      const { file, lineNumber, columnNumber } = match.groups;
      const methodMatch = line.match(
        /at (?<method>(async )?[\w \[\]\.<>]+) (\()?file:\/\//,
      );
      const method = methodMatch?.groups?.method;

      const filePath = `${file.trim().replace("file://", "")}.map`;
      try {
        const fileData = await readFile(filePath, "utf8");
        const data = JSON.parse(fileData);
        const consumer = await new SourceMapConsumer(data);
        const pos = consumer.originalPositionFor({
          line: Number.parseInt(lineNumber, 10),
          column: Number.parseInt(columnNumber, 10),
        });
        consumer.destroy();
        if (pos.source) {
          const name = pos.name || method;
          return `${copyIndentation(line)}at ${name ? `${name.trim()} (` : ""}file://${pos.source}:${pos.line}:${pos.column}${name ? ")" : ""}`;
        }

        return line;
      } catch {
        return line;
      }
    }),
  );
  return parsedLines.join("\n");
}

function copyIndentation(source: string) {
  // Regular expression to match leading whitespace (spaces or tabs)
  const match = source.match(/^\s*/);

  // Extract the matched indentation
  const indentation = match ? match[0] : "";
  return indentation;
}
