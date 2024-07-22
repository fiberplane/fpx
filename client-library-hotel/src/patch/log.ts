import { trace } from "@opentelemetry/api";
import { wrap } from "shimmer";
import { isWrapped } from "../utils";

type LOG = "log";
type INFO = "info";
type WARN = "warn";
type ERROR = "error";

type LEVELS = LOG | INFO | WARN | ERROR;

export function patchConsole() {
  patchMethod("log", "info");
  patchMethod("warn", "warn");
  patchMethod("error", "error");
  console.log("patched log", console.log.__wrapped);
}

function patchMethod(methodName: LEVELS, level: string) {
  // Check if the function is already patched
  // If it is, we don't want to patch it again
  if (isWrapped(console[methodName])) {
    console.log("already patched fetch");
    return;
  }

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
