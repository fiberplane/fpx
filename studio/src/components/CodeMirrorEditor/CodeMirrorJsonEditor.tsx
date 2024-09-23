import "./CodeMirrorEditorCssOverrides.css";

import { json } from "@codemirror/lang-json";
import { duotoneDark } from "@uiw/codemirror-theme-duotone";

import CodeMirror, { EditorView } from "@uiw/react-codemirror";
import { customTheme } from "./themes";

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
