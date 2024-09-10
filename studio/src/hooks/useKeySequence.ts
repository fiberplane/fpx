import { useInputFocusDetection } from "@/hooks";
import { useHandler } from "@fiberplane/hooks";
import { useEffect, useRef, useState } from "react";
import { useLatest } from "./useLatest";

type KeySequenceOptions = {
  isEnabled?: boolean;
  description?: string;
  timeoutMs?: number;
};

/**
 * Hook that allows you to define a key sequence and execute a callback when it is matched.
 *
 * @param targetKeySequence - The sequence of keys to match.
 * @param onSequenceMatched - The callback to execute when the sequence is matched.
 * @param options - Optional configuration options.
 * @returns A ref setter that can be used to scope the listener to a specific
 * element (default: the key sequence is scoped to the document).
 */
export function useKeySequence(
  targetKeySequence: string[],
  onSequenceMatched: () => void,
  options?: KeySequenceOptions,
) {
  const { isEnabled = true, timeoutMs = 2000 } = options ?? {};

  const { isInputFocused } = useInputFocusDetection();

  const [listenerElement, setListenerElement] = useState<HTMLElement | null>(
    null,
  );
  const [_currentKeySequence, setCurrentKeySequence] = useState<string[]>([]);

  const timeoutIdRef = useRef<number | NodeJS.Timeout>();

  const onSequenceMatchedRef = useLatest(onSequenceMatched);

  const resetKeySequence = useHandler(() => {
    setCurrentKeySequence([]);
  });

  // create and persist the callback across re-renders
  const handleKeyPress = useHandler((event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

    setCurrentKeySequence((prevSequence) => {
      const updatedSequence = [...prevSequence, event.key].slice(
        -targetKeySequence.length,
      );

      // Check if the updated sequence matches the target sequence
      if (updatedSequence.join("") === targetKeySequence.join("")) {
        onSequenceMatchedRef.current();
        return []; // Reset sequence after successful match
      }

      return updatedSequence;
    });

    // Reset timeout on each key press
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    timeoutIdRef.current = setTimeout(resetKeySequence, timeoutMs);
  });

  useEffect(() => {
    if (!isEnabled || isInputFocused) {
      return;
    }

    const domNode = listenerElement ?? document;

    domNode.addEventListener("keydown", handleKeyPress);
    return () => {
      domNode.removeEventListener("keydown", handleKeyPress);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [listenerElement, handleKeyPress, isEnabled, isInputFocused]);

  return setListenerElement;
}
