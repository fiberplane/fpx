import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Define a sequence of keys to be pressed in order to trigger a callback. Note that it should be used only for sequences, not chords. TODO: create a hook for chords.
 *
 * @param sequence - An array of keys to be pressed in order to trigger the callback.
 * @param callback - The callback to be executed when the sequence of keys is pressed.
 * @param timeout - The timeout in milliseconds to wait before executing the callback. Default is 2000.
 * @returns keySequence - An array of the keys that were pressed in order to trigger the callback. This is useful for debugging purposes.
 *
 */
export function useKeySequence(
  sequence: string[],
  callback: () => void,
  timeout: number = 2000,
) {
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const timeoutRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);
  const sequenceRef = useRef(sequence);

  // ensure that the callback and sequence are updated when they change
  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // create and persist the callback across re-renders
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    setKeySequence((prevKeySequence) => {
      const updatedSequence = [...prevKeySequence, event.key].slice(
        -sequenceRef.current.length,
      );

      return updatedSequence;
    });
  }, []);

  useEffect(() => {
    if (keySequence.join("") === sequenceRef.current.join("")) {
      callbackRef.current();
      setKeySequence([]);
    }
  }, [keySequence]);

  useEffect(() => {
    const resetSequence = () => setKeySequence([]);

    if (keySequence.length > 0) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(
        resetSequence,
        timeout,
      ) as unknown as number;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [keySequence, timeout]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return keySequence;
}
