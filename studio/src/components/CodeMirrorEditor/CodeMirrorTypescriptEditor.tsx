import "./CodeMirrorEditorCssOverrides.css";

import { javascript } from "@codemirror/lang-javascript";
import { duotoneDark } from "@uiw/codemirror-theme-duotone";

import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { customTheme } from "./themes";
import type { CodeMirrorEditorProps } from "./types";

type CodeMirrorTypescriptEditorProps = CodeMirrorEditorProps & {
  jsx: boolean;
};

export function CodeMirrorTypescriptEditor(
  props: CodeMirrorTypescriptEditorProps,
) {
  const { height, value, onChange, jsx, minHeight, maxHeight, readOnly } =
    props;
  return (
    <CodeMirror
      value={value}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      readOnly={readOnly}
      extensions={[
        EditorView.lineWrapping,
        javascript({ jsx, typescript: true }),
      ]}
      onChange={onChange}
      theme={[duotoneDark, customTheme]}
    />
  );
}
