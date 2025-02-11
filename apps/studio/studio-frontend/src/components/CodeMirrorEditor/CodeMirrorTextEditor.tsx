import "./CodeMirrorEditorCssOverrides.css";

import { duotoneDark } from "@uiw/codemirror-theme-duotone";
import CodeMirror, { basicSetup, EditorView } from "@uiw/react-codemirror";
import { useMemo } from "react";
import { createOnSubmitKeymap, escapeKeymap } from "./keymaps";
import { customTheme, duotonePlaintextOverride } from "./themes";

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

export function CodeMirrorTextEditor(props: CodeMirrorEditorProps) {
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
      createOnSubmitKeymap(onSubmit, false),
      basicSetup({
        searchKeymap: false,
      }),
      EditorView.lineWrapping,
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
      theme={[duotoneDark, duotonePlaintextOverride, customTheme]}
      readOnly={readOnly}
      basicSetup={false}
    />
  );
}
