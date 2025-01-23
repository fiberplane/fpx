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
      run: (view) => {
        if (onSubmit) {
          onSubmit();
          // NOTE - It's important for our workflows to blur the editor after the onSubmit function is called
          //        This way, you can submit a request and then type `g+t` to see the timeline
          view.contentDOM.blur();
          return true;
        }
        return bubbleWhenNoHandler;
      },
    },
  ]);

/**
 * Creates a keymap that calls the given (optional) handler function when the user presses "Mod-G"
 *
 * Useful for propagating the keyboard shortcut for the "Generate Data" command
 *
 * Will only work if you've disabled the Search keymaps in a codemirror component
 */
export const createCmdGKeymap = (
  handler: (() => void) | undefined,
  bubbleWhenNoHandler = true,
  blurWhenHandler = true,
) =>
  keymap.of([
    {
      key: "Mod-G",
      run: (view) => {
        if (handler) {
          handler();
          if (blurWhenHandler) {
            view.contentDOM.blur();
          }
          return true;
        }
        return bubbleWhenNoHandler;
      },
    },
  ]);

/**
 * Creates a keymap that calls the given (optional) handler function when the user presses "Mod-B"
 *
 * Useful for propagating the keyboard shortcut for the "Toggle Sidebar" command
 */
export const createCmdBKeymap = (
  handler: (() => void) | undefined,
  bubbleWhenNoHandler = true,
  blurWhenHandler = true,
) =>
  keymap.of([
    {
      key: "Mod-B",
      run: (view) => {
        console.log("cmd b");
        if (handler) {
          handler();
          if (blurWhenHandler) {
            view.contentDOM.blur();
          }
          return true;
        }
        return bubbleWhenNoHandler;
      },
    },
  ]);
