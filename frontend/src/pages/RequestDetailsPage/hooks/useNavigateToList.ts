import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";

export function useEscapeToList() {
  const navigate = useNavigate();

  const [isInputFocused, setIsInputFocused] = useState(false);

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

  useHotkeys(["Escape"], () => {
    // catch all the cases where the user is in the input field
    // and we don't want to exit the page
    if (isInputFocused) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement) {
        activeElement.blur();
      }
      return;
    }

    navigate("/requests");
  });

  useEffect(() => {
    // We can use AbortController to remove both event listeners a bit more cleanly
    // https://frontendmasters.com/blog/patterns-for-memory-efficient-dom-manipulation/#use-abortcontroller-to-unbind-groups-of-events
    document.addEventListener("focus", handleFocus, true);
    document.addEventListener("blur", handleBlur, true);
    return () => {
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("blur", handleBlur, true);
    };
  }, []);
}
