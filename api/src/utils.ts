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
        errorMessage ||
          `Assertion failed: Expected 'value' to be defined, but received ${value}`,
      );
    }
  } else if (typeof typeguardOrMessage === "function") {
    if (!typeguardOrMessage(value)) {
      throw new TypeError(
        errorMessage ||
          `Assertion failed: expected value ${value} to pass typeguard`,
      );
    }
  } else {
    throw new TypeError(
      `Expected 'typeguardOrMessage' to be a string or a function, but received ${typeof typeguardOrMessage}`,
    );
  }
}
