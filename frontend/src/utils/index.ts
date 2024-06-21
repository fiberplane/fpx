import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function formatDate(d: Date | string) {
  return format(new Date(d), "HH:mm:ss.SSS");
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function objectWithKey<T extends string>(
  value: unknown,
  key: T,
): value is { [K in T]: unknown } {
  return typeof value === "object" && value !== null && key in value;
}

export function objectWithKeyAndValue<T extends string, V>(
  value: unknown,
  key: T,
  expectedValue: V,
): value is { [K in T]: V } {
  return objectWithKey(value, key) && value[key] === expectedValue;
}

export function noop() {}

export function isJson(str: string) {
  try {
    JSON.parse(str);
  } catch {
    return false;
  }
  return true;
}

/**
 * Utility to see if an unknown type (an error) has a nonempty string property called "message"
 */
export function hasStringMessage(error: unknown): error is { message: string } {
  if (!error) {
    return false;
  }
  return (
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message !== ""
  );
}
