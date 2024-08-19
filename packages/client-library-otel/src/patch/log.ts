import { trace } from "@opentelemetry/api";
import shimmer from "shimmer";
import {
  errorToJson,
  isLikelyNeonDbError,
  isWrapped,
  neonDbErrorToJson,
  safelySerializeJSON,
} from "../utils";

const { wrap } = shimmer;

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
    // NOTE - Original message needs to be typed as `string` to be compatible with the original method,
    //        but in fact it is `unknown`.
    //        People pass non-string arguments to console.log all the time.
    return (originalMessage: string, ...args: unknown[]) => {
      const span = trace.getActiveSpan();

      if (span) {
        const { message, messageType } = serializeLogMessage(originalMessage);

        span.addEvent("log", {
          message: message,
          messageType,
          level,
          arguments: safelySerializeJSON(args?.map(transformLogMessage)),
        });
      }

      // IMPORTANT - We need to return the original message, otherwise the console method will not work as expected
      return original(originalMessage, ...args);
    };
  });
}

/**
 * Helper that takes the first argument to a log method and transforms it into a string
 * that can be logged.
 *
 * Also returns `messageType` to be used in the log event, as a hint to the UI.
 */
function serializeLogMessage(rawMessage: unknown) {
  const messageType = rawMessage === null ? "null" : typeof rawMessage;
  const transformedMessage = transformLogMessage(rawMessage);
  const stringifiedMessage =
    transformedMessage === "string"
      ? transformedMessage
      : safelySerializeJSON(transformedMessage);

  return {
    message: stringifiedMessage,
    messageType,
  };
}

/**
 * Helper that takes a log message and transforms it into something that
 * hopefully can be stringified (into JSON), we don't lose information on
 * what was logged.
 *
 * The reason this is necessary is because Error objects do not
 * serialize well to JSON.
 *
 * Also NeonDbErrors do not extend the Error class, so they need their own handling.
 */
function transformLogMessage(message: unknown) {
  if (isLikelyNeonDbError(message)) {
    return neonDbErrorToJson(message);
  }

  if (message instanceof Error) {
    return errorToJson(message);
  }

  return message;
}
