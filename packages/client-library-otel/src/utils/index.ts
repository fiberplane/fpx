export { getFromEnv } from "./env";
export * from "./errors";
export * from "./json";
export * from "./request";
export * from "./wrapper";
export { cloneResponse } from "./response";

export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
  return (
    isObject(value) &&
    "then" in value &&
    typeof (value as { then: unknown }).then === "function"
  );
}

export function isObject(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

export function objectWithKey<T extends string>(
  value: unknown,
  key: T,
): value is { [K in T]: unknown } {
  return isObject(value) && key in value;
}
