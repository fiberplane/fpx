import {
  type ConsolaOptions,
  createConsola,
  LogLevels,
  type LogObject,
  type LogType,
} from "consola";
import { getColor } from "consola/utils";

export const TYPE_COLOR_MAP = {
  info: "bgCyan",
  fail: "bgRed",
  success: "bgGreen",
  ready: "bgGreen",
  start: "bgMagenta",
} as const;


let last = Date.now()
const consola = createConsola({
  fancy: false,
  formatOptions: {
    colors: true,
    // columns: 100,
    date: true,
  },
  reporters: [
    {
      log: (
        logObj: LogObject,
        ctx: {
          options: ConsolaOptions;
        },
      ) => {

        const { type: logType, date } = logObj;
        const logTypeBlock = formatLogTypeBlock(logType);
        const dateString = getColor("green")(formatTime(date.getTime() - last).padEnd(8, " "));
        last = date.getTime();
        const leftColumn = `${dateString} ${logTypeBlock}`;

        const leftColumnSize = 18;
        ctx.options.stdout?.write(
          `${leftColumn} ${formatWithPadding(logObj.args.map(
            (arg) =>
              arg.toString()
          ).join(" "), leftColumnSize)}\n`,
        );
      },
    },
  ],
});
function formatWithPadding(str: string, padding: number) {
  const lines = str.split("\n");
  return lines.map(
    line => `${"".padStart(padding, " ")}${line}`
  )
    .join("\n")
    .trim()

}

function formatTime(ms: number): string {
  // if (ms >= 1000) {
  //   // Convert to seconds
  //   const seconds = ms / 1000;
  //   return `+${seconds.toFixed(2)}s`.slice(0, 6);

  // }
  if (ms >= 1000) {
    // Convert to seconds
    const seconds = ms / 1000;
    return `+${seconds.toFixed(2)}s`.slice(0, 7);
  }
  if (ms >= 1) {
    // Keep as milliseconds
    return `+${ms.toFixed(2)}ms`.slice(0, 7);
  }

  // Convert to microseconds
  const microseconds = ms * 1000;
  return `+${microseconds.toFixed(2)}µs`.slice(0, 7);
}

function formatLogTypeBlock(logType: LogType) {
  const levelColor = TYPE_COLOR_MAP[logType as keyof typeof TYPE_COLOR_MAP];

  const levelText = levelColor
    ? getColor("black")(getColor(levelColor)(` ${logType} `))
    : getColor("dim")(` ${logType} `);
  const padding = "".padStart(5 - logType.length, " ");
  return `${levelText} ${padding}`;
}

// Define the possible log levels
const logLevels = ["trace", "debug", "info", "warn", "error"] as const;
type LogLevel = (typeof logLevels)[number];

const isDev = process.env.npm_lifecycle_event === "dev";

// Determine the current log level from the environment variable or default to "info"
const defaultLogLevel: LogLevel = isDev ? "debug" : "info";
const currentLogLevel: LogLevel = isLogLevel(process.env.FPX_LOG_LEVEL)
  ? process.env.FPX_LOG_LEVEL
  : defaultLogLevel;

consola.level = LogLevels[currentLogLevel];
// /**
//  * Determines if a message at a given log level should be logged based on the current log level.
//  * @param level - The log level of the message.
//  * @returns True if the message should be logged, false otherwise.
//  */
// function shouldLog(level: LogLevel): boolean {
//   const currentLevelIndex = logLevels.indexOf(currentLogLevel);
//   const messageLevelIndex = logLevels.indexOf(level);
//   return messageLevelIndex >= currentLevelIndex;
// }

// Create a logger object with methods for each log level
// const logger = logLevels.reduce(
//   (acc, level) => {
//     /**
//      * Logs a message if the current log level allows it.
//      * @param message - The message to log.
//      * @param optionalParams - Additional parameters to log.
//      */
//     acc[level] = (message?: unknown, ...optionalParams: unknown[]) => {
//       // if (shouldLog(level)) {
//         consola[level](message, ...optionalParams);
//       // }
//     };
//     return acc;
//   },
//   {} as Record<
//     LogLevel,
//     (message?: unknown, ...optionalParams: unknown[]) => void
//   >,
// );

type Logger = Pick<typeof consola, "log" | "info" | "debug" | "warn" | "error">;
export default consola as Logger;

/**
 * Checks if a given level is a valid log level.
 * @param level - The level to check.
 * @returns True if the level is a valid LogLevel, false otherwise.
 */
function isLogLevel(level: unknown): level is LogLevel {
  return logLevels.includes(level as LogLevel);
}
