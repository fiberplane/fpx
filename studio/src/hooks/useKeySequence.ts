import { useInputFocusDetection } from "@/hooks";
import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "./useLatest";
import { useHandler } from "@fiberplane/hooks";

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

  const listenerElementRef = useRef<HTMLElement | null>(null);
  const currentKeySequenceRef = useRef<string[]>([]);
  const timeoutIdRef = useRef<number | NodeJS.Timeout>();

  const onSequenceMatchedRef = useLatest(onSequenceMatched);

  const resetKeySequence = useHandler(() => {
    currentKeySequenceRef.current = [];
  });

  const handleKeyPress = useCallback(
    (event: Event) => {
      if (!(event instanceof KeyboardEvent)) {
        return;
      }
      const domNode = listenerElementRef.current ?? document;

      if (event.target && !domNode.contains(event.target as Node)) {
        return;
      }

      currentKeySequenceRef.current = [
        ...currentKeySequenceRef.current,
        event.key,
      ].slice(-targetKeySequence.length);

      if (
        currentKeySequenceRef.current.join("") === targetKeySequence.join("")
      ) {
        onSequenceMatchedRef.current();
        currentKeySequenceRef.current = [];
      }

      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(resetKeySequence, timeoutMs);
    },
    [targetKeySequence, timeoutMs, resetKeySequence, onSequenceMatchedRef],
  );

  useEffect(() => {
    if (!isEnabled || isInputFocused) {
      return;
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [isEnabled, isInputFocused, handleKeyPress]);

  const setListenerElement = useHandler((element: HTMLElement | null) => {
    listenerElementRef.current = element;
  });

  return setListenerElement;
}
