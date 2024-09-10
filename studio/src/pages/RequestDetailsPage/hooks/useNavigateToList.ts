import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router-dom";
import { useInputFocusDetection } from "@/hooks";

export function useEscapeToList() {
  const navigate = useNavigate();
  const { isInputFocused, blurActiveInput } = useInputFocusDetection();

  useHotkeys(["Escape"], () => {
    // catch all the cases where the user is in the input field
    // and we don't want to exit the page
    if (isInputFocused) {
      blurActiveInput();
      return;
    }

    navigate("/requests");
  });
}
