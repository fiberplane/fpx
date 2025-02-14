// Define the possible log levels
const logLevels = ["trace", "debug", "info", "warn", "error"] as const;
type LogLevel = (typeof logLevels)[number];

export type AppLogger = ReturnType<typeof createLogger>;

export function createLogger(honcLogLevel: string) {
  // Determine the current log level from the environment variable or default to "info"
  const defaultLogLevel: LogLevel = "info";
  const currentLogLevel: LogLevel = isLogLevel(honcLogLevel)
    ? honcLogLevel
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
          console[level](message, ...optionalParams);
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
