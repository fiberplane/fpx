import type { Context } from "hono";

/**
 * Logs debug messages when debug mode is enabled.
 * Accepts either a boolean flag or a Hono Context to determine if debug is enabled.
 * (Assumes `c.get("debug")` stores the debug flag)
 *
 * Handles any logging errors by catching and ignoring them
 */

export function logIfDebug(
  debug: boolean,
  message: unknown,
  ...params: unknown[]
): void;
export function logIfDebug(
  debug: Context,
  message: unknown,
  ...params: unknown[]
): void;
export function logIfDebug(
  debug: boolean | Context,
  message: unknown,
  ...params: unknown[]
): void {
  try {
    // If debug is a boolean, we use it directly
    // If "debug" is a Context, we check the debug flag from the context's variable's map
    const debugEnabled =
      typeof debug === "boolean" ? debug : !!debug?.get("debug");
    if (debugEnabled) {
      console.debug("[fiberplane:debug] ", message, ...params);
    }
  } catch {
    // If the debug log failed for whatever reason, we'll just swallow the error
  }
}
