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
  const sequenceRef = useRef<{ sequence: string[]; callback: () => void }[]>(
    [],
  );

  // this is so we can call the useKeySequence hook multiple times
  // an alternative would be to have a `useKeySequences([{sequence, callback}])` hook
  // to register all in one
  useEffect(() => {
    sequenceRef.current.push({ sequence, callback });
  }, [sequence, callback]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    setKeySequence((prevKeySequence) => {
      const updatedSequence = [...prevKeySequence, event.key].slice(
        -sequence.length,
      );

      if (updatedSequence.join("") === sequence.join("")) {
        callback();
        return [];
      }

      return updatedSequence;
    });
    // including the deps here would recreate callback whenever the deps change
    // which is not what we want
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
