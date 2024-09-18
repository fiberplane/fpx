export { getFromEnv } from "./env";
export * from "./errors";
export * from "./json";
export * from "./request";
export * from "./wrapper";
export { cloneResponse } from "./response";

export function isPromise<T>(value: unknown): value is Promise<T> {
  return value instanceof Promise;
}
