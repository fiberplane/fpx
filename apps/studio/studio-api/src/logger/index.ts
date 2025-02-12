import { type ConsolaInstance, LogLevels, createConsola } from "consola";
import { createReporter } from "./reporter.js";
import type { Logger } from "./types.js";

const consola = createConsola({
  reporters: [createReporter()],
});

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

/**
 * Create a wrapper around the (internal) consola instance to provide a (subset of) more traditional console.log/warn/etc style api
 */
function wrapConsola(logInstance: ConsolaInstance): Logger {
  return {
    log: (message: unknown, ...args: unknown[]) =>
      logInstance.log({ message, args }),
    info: (message: unknown, ...args: unknown[]) =>
      logInstance.info({ message, args }),
    debug: (message: unknown, ...args: unknown[]) =>
      logInstance.debug({ message, args }),
    warn: (message: unknown, ...args: unknown[]) =>
      logInstance.warn({ message, args }),
    error: (message: unknown, ...args: unknown[]) =>
      logInstance.error({ message, args }),
    withTag: (tag: string) => wrapConsola(logInstance.withTag(tag)),
  };
}

const logger = wrapConsola(consola);
export default logger;

/**
 * Checks if a given level is a valid log level.
 * @param level - The level to check.
 * @returns True if the level is a valid LogLevel, false otherwise.
 */
function isLogLevel(level: unknown): level is LogLevel {
  return logLevels.includes(level as LogLevel);
}
