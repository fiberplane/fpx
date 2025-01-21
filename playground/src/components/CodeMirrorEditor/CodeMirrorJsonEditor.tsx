import "./CodeMirrorEditorCssOverrides.css";

import { json } from "@codemirror/lang-json";
import { basicDark } from "@uiw/codemirror-theme-basic";
import { duotoneLight } from "@uiw/codemirror-theme-duotone";
import CodeMirror, { basicSetup, EditorView } from "@uiw/react-codemirror";
import { useMemo } from "react";
import { useThemeMode } from "../theme-provider";
import { createOnSubmitKeymap, escapeKeymap } from "./keymaps";
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

  const mode = useThemeMode();

  const extensions = useMemo(
    () => [
      createOnSubmitKeymap(onSubmit, false),
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
      theme={[mode === "light" ? duotoneLight : basicDark, customTheme]}
      readOnly={readOnly}
      // Turn off basic setup here, but then use it as an extension instead (in the extension array),
      // AFTER using a keymap that allows us to conditionally intercept the "Mod+Enter" combo
      basicSetup={false}
    />
  );
}
