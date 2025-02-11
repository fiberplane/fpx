import { useEffect, useState } from "react";

export function useInputFocusDetection() {
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
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

    document.addEventListener("focus", handleFocus, { capture: true });
    document.addEventListener("blur", handleBlur, { capture: true });

    return () => {
      document.removeEventListener("focus", handleFocus);
      document.removeEventListener("blur", handleBlur);
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
