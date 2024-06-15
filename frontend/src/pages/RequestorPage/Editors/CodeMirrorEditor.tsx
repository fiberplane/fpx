import "./CodeMirrorEditorCssOverrides.css";

import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror from "@uiw/react-codemirror";

type CodeMirrorEditorProps = {
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  theme?: string;
  readOnly?: boolean;
  value?: string;
  onChange: (value?: string) => void;
};

export function CodeMirrorJsonEditor(props: CodeMirrorEditorProps) {
  const {
    height,
    value,
    onChange,
    readOnly,
    minHeight = "200px",
    maxHeight,
  } = props;
  return (
    <CodeMirror
      value={value}
      height={height}
      maxHeight={maxHeight}
      minHeight={minHeight}
      extensions={[json()]}
      onChange={onChange}
      theme={vscodeLight}
      readOnly={readOnly}
    />
  );
}

type CodeMirrorTypescriptEditorProps = CodeMirrorEditorProps & {
  jsx: boolean;
};

export function CodeMirrorTypescriptEditor(
  props: CodeMirrorTypescriptEditorProps,
) {
  const { height, value, onChange, jsx, minHeight, maxHeight } = props;
  return (
    <CodeMirror
      value={value}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      extensions={[javascript({ jsx, typescript: true })]}
      onChange={onChange}
    />
  );
}
