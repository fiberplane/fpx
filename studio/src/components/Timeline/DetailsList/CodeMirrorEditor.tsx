import { cn } from "@/utils";
import "./CodeMirrorEditorCssOverrides.css";

import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { sql } from "@codemirror/lang-sql";
import { duotoneDark } from "@uiw/codemirror-theme-duotone";
// import { gutter } from "@codemirror/gutter";

import CodeMirror, {
  EditorView,
  // Extension,
  gutter,
} from "@uiw/react-codemirror";
import { useState } from "react";

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

const inputTheme = EditorView.theme({
  "&": {
    fontSize: "14px",
    // HACK
    background: "transparent !important",
  },
  ".cm-gutters": {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  ".cm-cursor": {
    borderLeftColor: "white",
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

const inputBaseStylesExtension = EditorView.theme({
  ".cm-placeholder": {
    color: "hsl(var(--muted-foreground))",
    // HACK - Using tailwind `text-sm`
    fontSize: "0.875rem !important",
    lineHeight: "1.25rem !important",
  },
});

// Hacky extension to modify the editor to look like an input,
// and truncate text (when not focused)
const inputTrucateExtension = EditorView.theme({
  ".cm-scroller": {
    overflow: "hidden !important",
    maxWidth: "100% !important",
  },
  ".cm-content": {
    whiteSpace: "nowrap !important",
    overflow: "hidden !important",
    textOverflow: "ellipsis !important",
    width: "100% !important",
    flexBasis: "auto !important", // Override the inline flex-basis
  },
  ".cm-line": {
    display: "block !important",
    textOverflow: "ellipsis !important",
    overflow: "hidden !important",
    width: "100% !important",
  },

});

const CODE_MIRROR_BASIC_SETUP = {
  lineNumbers: false,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
  bracketMatching: false,
  closeBrackets: false,
  autocompletion: false,
  rectangularSelection: false,
  highlightActiveLine: false,
  highlightSelectionMatches: false,
  closeBracketsKeymap: false,
  defaultKeymap: false,
  searchKeymap: false,
  historyKeymap: false,
  foldKeymap: false,
  completionKeymap: false,
  lintKeymap: false,
}

const hiddenGutterExtension = gutter({ class: "hidden border-none" });

export function CodeMirrorInput(props: CodeMirrorEditorProps) {
  const { value, onChange, minHeight = "28px", placeholder } = props;

  // State to manage focus
  const [isFocused, setIsFocused] = useState(false);

  // Dynamic height based on focus state
  const dynamicHeight = isFocused ? "auto" : minHeight;

  return (
    <div
      className={cn("rounded ", "focus-visible:outline-none", {
        "border border-blue-600": isFocused,
        // HACK - This prevents a "jump" for the placeholder or input text when clicking on the input
        "border-l border-transparent": !isFocused
      })}
      style={{
        width: "160px", // fixed width
        height: dynamicHeight, // dynamic height based on focus
        overflow: isFocused ? "auto" : "hidden", // show scroll when focused, hide when not
        whiteSpace: isFocused ? "normal" : "nowrap", // change to ellipsis on blur
        textOverflow: isFocused ? "clip" : "ellipsis",
        cursor: "text", // show text cursor when hovering
      }}
    >
      <CodeMirror
        value={value}
        height={dynamicHeight}
        // maxHeight={maxHeight}
        minHeight={minHeight}
        onChange={onChange}
        theme={[inputTheme]}
        extensions={[
          hiddenGutterExtension,
          inputBaseStylesExtension,
          isFocused ? EditorView.lineWrapping : inputTrucateExtension,
        ]}
        onFocus={() => setIsFocused(true)} // Set focus to true
        onBlur={() => setIsFocused(false)} // Set focus to false
        basicSetup={CODE_MIRROR_BASIC_SETUP}
        placeholder={placeholder}
      />
    </div>
  );
}
