import { useCallback, useEffect, useRef, useState } from "react";

export function useKeySequence(
  sequence: string[],
  callback: () => void,
  timeout: number = 2000,
) {
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const timeoutRef = useRef<number | undefined>(undefined);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
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
    },
    [sequence, callback],
  );

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
