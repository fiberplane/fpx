import "./CodeMirrorEditorCssOverrides.css";

import { sql } from "@codemirror/lang-sql";
import { duotoneLight } from "@uiw/codemirror-theme-duotone";

import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { customTheme } from "./themes";
import type { CodeMirrorEditorProps } from "./types";

type CodeMirrorSqlEditorProps = CodeMirrorEditorProps & {
  /**
   * Whether to show line numbers in the editor
   * @default true
   */
  lineNumbers?: boolean;
};

export function CodeMirrorSqlEditor(props: CodeMirrorSqlEditorProps) {
  const {
    height,
    value,
    onChange,
    minHeight,
    maxHeight,
    readOnly,
    lineNumbers,
  } = props;
  return (
    <CodeMirror
      value={value}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      readOnly={readOnly}
      extensions={[EditorView.lineWrapping, sql()]}
      onChange={onChange}
      theme={[duotoneLight, customTheme]}
      basicSetup={{
        lineNumbers: lineNumbers ?? true,
      }}
    />
  );
}
