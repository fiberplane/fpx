import { useEffect, useState } from "react";

export function useInputFocusDetection() {
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const handleFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLInputElement) {
        setIsInputFocused(true);
      }
    };

    const handleBlur = (event: FocusEvent) => {
      if (event.target instanceof HTMLInputElement) {
        setIsInputFocused(false);
      }
    };

    document.addEventListener("focus", handleFocus, { capture: true, signal });
    document.addEventListener("blur", handleBlur, { capture: true, signal });

    return () => {
      abortController.abort();
    };
  }, []);

  const blurActiveInput = () => {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLInputElement) {
      activeElement.blur();
    }
  };

  return { isInputFocused, blurActiveInput };
}
