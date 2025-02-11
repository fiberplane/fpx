import fs from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { highlight } from "cli-highlight";
import { BASE_OUTPUT_DIR } from "./constants";
import { type TimingData, visualizeTimingData } from "./timing-visualizer";

export async function visualizeTrace(traceId: string): Promise<void> {
  const traceDir = path.join(BASE_OUTPUT_DIR, traceId);
  const files = await fs.readdir(traceDir);

  for (const file of files) {
    const filePath = path.join(traceDir, file);
    const content = await fs.readFile(filePath, "utf-8");

    console.log(chalk.bold.blue(`\n--- ${file} ---`));

    if (file.endsWith(".json")) {
      const parsedContent = JSON.parse(content);
      if (file.endsWith("timings.json")) {
        console.log(visualizeTimingData(parsedContent as TimingData));
      } else {
        console.log(formatJsonOutput(parsedContent));
      }
    } else if (file.endsWith(".ts")) {
      console.log(
        highlight(content, { language: "typescript", theme: "vscode-dark" }),
      );
    } else if (file.endsWith(".toml")) {
      console.log(
        highlight(content, { language: "toml", theme: "vscode-dark" }),
      );
    } else {
      console.log(content);
    }
  }
}

function formatJsonOutput(obj: unknown, indent = ""): string {
  if (typeof obj !== "object" || obj === null) {
    return formatPrimitiveValue(obj);
  }

  const isArray = Array.isArray(obj);
  const brackets = isArray ? ["[", "]"] : ["{", "}"];
  const lines: string[] = [brackets[0]];

  for (const [key, value] of Object.entries(obj)) {
    const formattedKey = isArray ? "" : `${chalk.green(JSON.stringify(key))}: `;
    const formattedValue = formatJsonOutput(value, `${indent}  `);
    lines.push(`${indent}  ${formattedKey}${formattedValue},`);
  }

  lines.push(`${indent}${brackets[1]}`);
  return lines.join("\n");
}

function formatPrimitiveValue(value: unknown): string {
  if (typeof value === "string" && value.includes("\n")) {
    return chalk.yellow(`\`${value.replace(/\\n/g, "\n")}\``);
  }
  return chalk.cyan(JSON.stringify(value));
}
