/**
 * NOT IN USE - Example code for if we want to try using Monaco editor, to feel more like VSCode
 */

import { Editor } from "@monaco-editor/react";

type MonacoJsonEditorProps = {
  height?: string;
  theme?: string;
  readOnly?: boolean;
  value?: string;
  onChange: (value?: string) => void;
};

export function MonacoJsonEditor({
  height = "400px",
  theme = "vs-light",
  readOnly = false,
  value,
  onChange,
}: MonacoJsonEditorProps) {
  return (
    <Editor
      height={height}
      defaultLanguage="json"
      defaultValue="{}"
      onChange={(newValue) => onChange(newValue)}
      value={value}
      options={{
        minimap: { enabled: false, autohide: true },
        tabSize: 2,
        codeLens: false,
        scrollbar: {
          vertical: "auto",
          horizontal: "hidden", // Hide because word wrap is on
        },
        theme,
        padding: {
          top: 0,
          bottom: 0,
        },
        lineNumbersMinChars: 3,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        readOnly,
      }}
    />
  );
}
