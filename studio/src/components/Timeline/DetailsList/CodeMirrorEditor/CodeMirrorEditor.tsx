import "./CodeMirrorEditorCssOverrides.css";

import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { sql } from "@codemirror/lang-sql";
import { duotoneDark } from "@uiw/codemirror-theme-duotone";

import CodeMirror, { EditorView } from "@uiw/react-codemirror";

type CodeMirrorEditorProps = {
  height?: string;
  minHeight?: string;
  maxHeight?: string;
  theme?: string;
  readOnly?: boolean;
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
};

const customTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    // HACK
    background: "transparent !important",
  },
});

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
      extensions={[EditorView.lineWrapping, json()]}
      onChange={onChange}
      theme={[duotoneDark, customTheme]}
      readOnly={readOnly}
      basicSetup={{
        // Turn off searching the input via cmd+g and cmd+f
        searchKeymap: false,
        // Investigate: Remap the default keymap: https://codemirror.net/docs/ref/#commands.defaultKeymap
        //              This will allow us to do things like cmd+enter to submit a payload
      }}
    />
  );
}

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
      extensions={[javascript({ jsx, typescript: true })]}
      onChange={onChange}
      theme={[duotoneDark, customTheme]}
    />
  );
}

type CodeMirrorSqlEditorProps = CodeMirrorEditorProps;

export function CodeMirrorSqlEditor(props: CodeMirrorSqlEditorProps) {
  const { height, value, onChange, minHeight, maxHeight, readOnly } = props;
  return (
    <CodeMirror
      value={value}
      height={height}
      minHeight={minHeight}
      maxHeight={maxHeight}
      readOnly={readOnly}
      extensions={[EditorView.lineWrapping, sql()]}
      onChange={onChange}
      theme={[duotoneDark, customTheme]}
    />
  );
}
