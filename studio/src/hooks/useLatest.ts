import { useRef } from "react";

/**
 * Hook that returns the latest value of a variable.
 *
 * @param value - The value to track.
 * @returns An object with a `current` property that holds the latest value.
 */
export function useLatest<T>(value: T): { readonly current: T } {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
