import { useCallback, useEffect, useRef, useState } from "react";
import { useInputFocusDetection } from "@/hooks";

type KeySequenceOptions = {
  enabled?: boolean;
  description?: string;
  timeout?: number;
};

export function useKeySequence(
  sequence: string[],
  callback: () => void,
  options?: KeySequenceOptions,
) {
  const { enabled = true, timeout = 2000 } = options ?? {};

  const { isInputFocused } = useInputFocusDetection();

  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [keySequence, setKeySequence] = useState<string[]>([]);

  const timeoutRef = useRef<number | NodeJS.Timeout | undefined>(undefined);
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
  const handleKeyPress = useCallback((event: Event) => {
    if (!(event instanceof KeyboardEvent)) {
      return;
    }

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

      timeoutRef.current = setTimeout(resetSequence, timeout);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [keySequence, timeout]);

  useEffect(() => {
    if (!enabled || isInputFocused) {
      return;
    }

    const domNode = ref ?? document;

    domNode.addEventListener("keydown", handleKeyPress);
    return () => {
      domNode.removeEventListener("keydown", handleKeyPress);
    };
  }, [ref, handleKeyPress, enabled, isInputFocused]);

  return setRef;
}
