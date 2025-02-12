import "./CodeMirrorEditorCssOverrides.css";

import { duotoneLight } from "@uiw/codemirror-theme-duotone";
import CodeMirror, { basicSetup, EditorView } from "@uiw/react-codemirror";
import { useMemo } from "react";
import {
  createCmdBKeymap,
  createCmdGKeymap,
  createOnSubmitKeymap,
  escapeKeymap,
} from "./keymaps";
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
  handleCmdG?: () => void;
  handleCmdB?: () => void;
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
    handleCmdG,
    handleCmdB,
  } = props;

  const extensions = useMemo(
    () => [
      createOnSubmitKeymap(onSubmit, false),
      createCmdGKeymap(handleCmdG, false, false),
      createCmdBKeymap(handleCmdB, false, false),
      basicSetup({
        searchKeymap: false,
      }),
      EditorView.lineWrapping,
      escapeKeymap,
    ],
    [onSubmit, handleCmdG, handleCmdB],
  );

  return (
    <CodeMirror
      value={value}
      height={height}
      maxHeight={maxHeight}
      minHeight={minHeight}
      extensions={extensions}
      onChange={onChange}
      theme={[duotoneLight, duotonePlaintextOverride, customTheme]}
      readOnly={readOnly}
      basicSetup={false}
    />
  );
}
