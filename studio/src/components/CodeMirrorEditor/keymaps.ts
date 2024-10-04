import { keymap } from "@uiw/react-codemirror";

// Extension that blurs the editor when the user presses "Escape"
export const escapeKeymap = keymap.of([
  {
    key: "Escape",
    run: (view) => {
      view.contentDOM.blur();
      return true;
    },
  },
]);

/**
 * Creates a keymap that calls the given (optional) onSubmit function when the user presses "Mod-Enter"
 *
 * @param onSubmit - Function to call when the user presses "Mod-Enter"
 * @param bubbleWhenNoHandler - If there is no onSubmit function, let another extension handle the key event
 * @returns - Keymap that calls the onSubmit function when the user presses "Mod-Enter"
 */
export const createOnSubmitKeymap = (
  onSubmit: (() => void) | undefined,
  bubbleWhenNoHandler = true,
) =>
  keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        if (onSubmit) {
          onSubmit();
          return true;
        }
        return bubbleWhenNoHandler;
      },
    },
  ]);
