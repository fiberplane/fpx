import "./CodeMirrorEditorCssOverrides.css";

import { json } from "@codemirror/lang-json";
import { duotoneDark } from "@uiw/codemirror-theme-duotone";
import CodeMirror, {
  basicSetup,
  EditorView,
  keymap,
} from "@uiw/react-codemirror";
import { useMemo } from "react";
import { customTheme } from "./themes";

type CodeMirrorEditorProps = {
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  theme?: string;
  readOnly?: boolean;
  value?: string;
  onChange: (value?: string) => void;
  onSubmit?: () => void;
};

// Extension that blurs the editor when the user presses "Escape"
const escapeKeymap = keymap.of([
  {
    key: "Escape",
    run: (view) => {
      view.contentDOM.blur();
      return true;
    },
  },
]);

const submitKeymap = (onSubmit: (() => void) | undefined) =>
  keymap.of([
    {
      key: "Mod-Enter",
      run: () => {
        if (onSubmit) {
          onSubmit();
          return true;
        }
        return false;
      },
    },
  ]);

export function CodeMirrorJsonEditor(props: CodeMirrorEditorProps) {
  const {
    height,
    value,
    onChange,
    readOnly,
    minHeight = "200px",
    maxHeight,
    onSubmit,
  } = props;

  const extensions = useMemo(
    () => [
      submitKeymap(onSubmit),
      basicSetup({
        // Turn off searching the input via cmd+g and cmd+f
        searchKeymap: false,
      }),
      EditorView.lineWrapping,
      json(),
      escapeKeymap,
    ],
    [onSubmit],
  );

  return (
    <CodeMirror
      value={value}
      height={height}
      maxHeight={maxHeight}
      minHeight={minHeight}
      extensions={extensions}
      onChange={onChange}
      theme={[duotoneDark, customTheme]}
      readOnly={readOnly}
      // Turn off basic setup here, but then use it as an extension instead (in the extension array),
      // AFTER using a keymap that allows us to conditionally intercept the "Mod+Enter" combo
      basicSetup={false}
    />
  );
}
