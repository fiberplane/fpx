import { type ClassValue, clsx } from "clsx";
import { format, formatDistanceToNow, formatRFC7231 } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string) {
  return format(new Date(d), "HH:mm:ss.SSS");
}

export function humanReadableDate(dateString: string) {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
}

export function rfc7231Date(dateString: string) {
  return formatRFC7231(new Date(dateString));
}

export function assert<T>(
  value: unknown | any,
  typeguard: (val: unknown) => val is T,
  errorMessage?: string,
): asserts value is T;

export function assert(
  value: unknown | any,
  errorMessage?: string,
): asserts value is NonNullable<unknown>;

export function assert(
  value: unknown | any,
  typeguardOrMessage?: ((val: unknown) => boolean) | string,
  errorMessage?: string,
): void {
  if (typeof typeguardOrMessage === "string") {
    errorMessage = typeguardOrMessage;
    if (value === null || value === undefined) {
      throw new TypeError(
        errorMessage || `Expected 'value' to be defined, but received ${value}`,
      );
    }
  }

  if (typeof typeguardOrMessage === "function") {
    if (!typeguardOrMessage(value)) {
      throw new TypeError(errorMessage || `Invalid value: ${value}`);
    }
  }

  throw new TypeError(
    `Expected 'typeguardOrMessage' to be a string or a function, but received ${typeof typeguardOrMessage}`,
  );
}
