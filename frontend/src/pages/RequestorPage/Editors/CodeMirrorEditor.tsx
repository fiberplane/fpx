import "./CodeMirrorEditorCssOverrides.css";

import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { vscodeLight } from "@uiw/codemirror-theme-vscode";
import CodeMirror from "@uiw/react-codemirror";

type CodeMirrorEditorProps = {
  height?: string;
  maxHeight?: string;
  theme?: string;
  readOnly?: boolean;
  value?: string;
  onChange: (value?: string) => void;
};

export function CodeMirrorJsonEditor(props: CodeMirrorEditorProps) {
  const { height, value, onChange, readOnly } = props;
  return (
    <CodeMirror
      value={value}
      height={height}
      maxHeight={props.maxHeight}
      minHeight="200px"
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
  const { height = "400px", value, onChange, jsx } = props;
  return (
    <CodeMirror
      value={value}
      height={height}
      extensions={[javascript({ jsx, typescript: true })]}
      onChange={onChange}
    />
  );
}
