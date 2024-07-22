import { trace } from "@opentelemetry/api";
import { wrap } from "shimmer";

type LOG = "log";
type INFO = "info";
type WARN = "warn";
type ERROR = "error";

type LEVELS = LOG | INFO | WARN | ERROR;

let patched = false;
export function patchConsole() {
  if (patched) {
    return;
  }
  
  patched = true;

  patchMethod("log", "info");
  patchMethod("warn", "warn");
  patchMethod("error", "error");
}

function patchMethod(methodName: LEVELS, level: string) {
  
  wrap(console, methodName, (original) => {
    return (message: string, ...args: unknown[]) => {
      const span = trace.getActiveSpan();
      if (span) {
        span.addEvent("log", {
          message,
          level,
          arguments: JSON.stringify(args),
        });
      }
      return original(message, ...args);
    };
  });
}
