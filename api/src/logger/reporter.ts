import { sep } from "node:path";
import { formatWithOptions } from "node:util";

import type { ConsolaOptions, LogObject, LogType } from "consola";
import { colors } from "consola/utils";
import prettyMs from "pretty-ms";

export const TYPE_COLOR_MAP = {
  info: colors.bgBlackBright,
  error: colors.bgRed,
  success: colors.bgGreen,
  warn: colors.bgYellow,
} as const;

export function createReporter() {
  let last = Date.now();
  return {
    log: (
      logObj: LogObject,
      ctx: {
        options: ConsolaOptions;
      },
    ) => {
      const { type: logType, date } = logObj;
      const duration = colors.green(
        `+${prettyMs(date.getTime() - last)}`.padStart(6, " "),
      );
      last = date.getTime();

      const logTypeBlock = formatLogTypeBlock(logType);
      const tagText = logObj.tag ? `[${logObj.tag}] ` : "";

      // Decide whether to write to stdout or stderr based on the log level
      const stream =
        logObj.level < 2
          ? ctx.options.stderr || process.stderr
          : ctx.options.stdout || process.stdout;

      const durationLevelColumnWidth = 16 + tagText.length;
      const columns = stream.columns - durationLevelColumnWidth;
      const logText = formatWithPadding(
        `${colors.dim(tagText)}${formatArgs(logObj.args, { columns })}`,
        durationLevelColumnWidth,
      );

      stream.write(`${duration} ${logTypeBlock} ${logText}\n`);
    },
  };
}

function formatWithPadding(str: string, padding: number) {
  const lines = str.split("\n");
  return lines
    .map((line) => `${"".padStart(padding, " ")}${line}`)
    .join("\n")
    .trim();
}

function formatLogTypeBlock(logType: LogType) {
  const levelColor = TYPE_COLOR_MAP[logType as keyof typeof TYPE_COLOR_MAP];

  const text = ` ${logType.padEnd(6, " ")}`;
  const levelText = levelColor
    ? colors.black(levelColor(text))
    : colors.dim(text);
  return `${levelText} `;
}

function formatArgs(args: unknown[], opts: { columns: number }) {
  const _args = args.map((arg) => {
    if (
      arg &&
      typeof arg === "object" &&
      "stack" in arg &&
      typeof arg.stack === "string" &&
      "message" in arg
    ) {
      return `${arg.message}\n${formatStack(arg.stack)}`;
    }

    return arg;
  });

  return formatWithOptions(
    {
      colors: true,
      breakLength: opts.columns,
    },
    ..._args,
  );
}

function formatStack(stack: string) {
  return parseStack(stack)
    .map(
      (line) =>
        `  ${line
          .replace(/^at +/, (m) => colors.gray(m))
          .replace(/\((.+)\)/, (_, m) => `(${colors.cyan(m)})`)}`,
    )
    .join("\n");
}

function parseStack(stack: string) {
  const cwd = process.cwd() + sep;

  const lines = stack
    .split("\n")
    .splice(1)
    .map((l) => l.trim().replace("file://", "").replace(cwd, ""));

  return lines;
}
