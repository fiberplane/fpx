import { trace } from "@opentelemetry/api";
import { wrap } from "shimmer";
import { isWrapped, safelySerializeJSON } from "../utils";

type DEBUG = "debug";
type LOG = "log";
type INFO = "info";
type WARN = "warn";
type ERROR = "error";

type LEVELS = LOG | INFO | WARN | ERROR | DEBUG;

export function patchConsole() {
  patchMethod("debug", "debug");
  patchMethod("log", "info");
  patchMethod("warn", "warn");
  patchMethod("error", "error");
}

function patchMethod(methodName: LEVELS, level: string) {
  // Check if the function is already patched
  // If it is, we don't want to patch it again
  if (isWrapped(console[methodName])) {
    return;
  }

  wrap(console, methodName, (original) => {
    return (rawMessage: string, ...args: unknown[]) => {
      const span = trace.getActiveSpan();
      const messageType = rawMessage === null ? "null" : typeof rawMessage;
      const message =
        messageType === "string" ? rawMessage : safelySerializeJSON(rawMessage);
      if (span) {
        span.addEvent("log", {
          message,
          messageType,
          level,
          arguments: JSON.stringify(args),
        });
      }

      return original(rawMessage, ...args);
    };
  });
}
