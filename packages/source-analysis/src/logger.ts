type LogFn = (message: unknown, ...args: unknown[]) => void;

export type Logger = {
  info: LogFn;
  debug: LogFn;
  warn: LogFn;
  error: LogFn;
  log: LogFn;
};

let _logger: Logger = console;

export const logger = {
  get logger(): Logger {
    return _logger;
  },

  set logger(newLogger: Logger) {
    _logger = newLogger;
  },

  get log(): LogFn {
    return _logger.log;
  },

  get info(): LogFn {
    return _logger.info;
  },

  get debug(): LogFn {
    return _logger.debug;
  },

  get warn(): LogFn {
    return _logger.warn;
  },

  get error(): LogFn {
    return _logger.error;
  },
};
