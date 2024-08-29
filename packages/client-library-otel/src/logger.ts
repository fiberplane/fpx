import type { HonoLikeEnv } from "./types";

// Define the possible log levels
const logLevels = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof logLevels)[number];

const debugLog = console.debug.bind(console);
const infoLog = console.info.bind(console);
const warnLog = console.warn.bind(console);
const errorLog = console.error.bind(console);

const ourConsole = {
  debug: debugLog,
  info: infoLog,
  warn: warnLog,
  error: errorLog,
};

/**
 * Get a logger that can be used to log messages to the console.
 * - Optionally log depending on the FPX_LOG_LEVEL environment variable.
 * - By default, log everything when in development mode, and log "warn" and above otherwise.
 *
 * @OPTIMIZE - This creates a new logger every time it's called.
 *             (But this is somewhat necessary, because the logger needs to be able to access the environment variables.
 *              In CF Workers, the environment variables are only available at runtime,
 *              and a single worker's env might get reused across requests.)
 *
 * @param honoEnv - The environment variables from the Hono app.
 * @returns A logger object with methods for each log level
 */
export function getLogger(honoEnv: HonoLikeEnv) {
  // TODO - Update with Node.js env utilties after https://github.com/fiberplane/fpx/pull/208 is merged

  // @ts-expect-error - We know the env might be a record with string keys
  const FPX_LOG_LEVEL = honoEnv?.FPX_LOG_LEVEL;

  // Determine the current log level from the environment variable or default to "warn"
  const defaultLogLevel: LogLevel = "warn";
  const currentLogLevel: LogLevel = isLogLevel(FPX_LOG_LEVEL)
    ? FPX_LOG_LEVEL
    : defaultLogLevel;

  /**
   * Determines if a message at a given log level should be logged based on the current log level.
   * @param level - The log level of the message.
   * @returns True if the message should be logged, false otherwise.
   */
  function shouldLog(level: LogLevel): boolean {
    const currentLevelIndex = logLevels.indexOf(currentLogLevel);
    const messageLevelIndex = logLevels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  // Create a logger object with methods for each log level
  const logger = logLevels.reduce(
    (acc, level) => {
      /**
       * Logs a message if the current log level allows it.
       * @param message - The message to log.
       * @param optionalParams - Additional parameters to log.
       */
      acc[level] = (message?: unknown, ...optionalParams: unknown[]) => {
        if (shouldLog(level)) {
          ourConsole[level](message, ...optionalParams);
        }
      };
      return acc;
    },
    {} as Record<
      LogLevel,
      (message?: unknown, ...optionalParams: unknown[]) => void
    >,
  );

  return logger;
}

/**
 * Checks if a given level is a valid log level.
 * @param level - The level to check.
 * @returns True if the level is a valid LogLevel, false otherwise.
 */
function isLogLevel(level: unknown): level is LogLevel {
  return logLevels.includes(level as LogLevel);
}
