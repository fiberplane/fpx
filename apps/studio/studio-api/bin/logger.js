/**
 * Logger that conditionally logs based off of env var: FPX_LOG_LEVEL
 */

const logLevels = ["debug", "info", "warn", "error"];
const currentLogLevel = isLogLevel(process.env.FPX_LOG_LEVEL)
  ? process.env.FPX_LOG_LEVEL
  : "info";

const logger = logLevels.reduce((acc, level) => {
  /**
   * Logs a message if the current log level allows it.
   * @param message - The message to log.
   * @param optionalParams - Additional parameters to log.
   */
  acc[level] = (message, ...optionalParams) => {
    if (shouldLog(level)) {
      console[level](message, ...optionalParams);
    }
  };
  return acc;
}, {});

function shouldLog(level) {
  const currentLevelIndex = logLevels.indexOf(currentLogLevel);
  const messageLevelIndex = logLevels.indexOf(level);
  return messageLevelIndex >= currentLevelIndex;
}

function isLogLevel(level) {
  return logLevels.includes(level);
}

export default logger;
