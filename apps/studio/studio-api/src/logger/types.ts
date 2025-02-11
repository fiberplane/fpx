export type LogFn = (...args: unknown[]) => void;

export type Logger = {
  info: LogFn;
  debug: LogFn;
  warn: LogFn;
  error: LogFn;
  log: LogFn;
  withTag: (tag: string) => Logger;
};
