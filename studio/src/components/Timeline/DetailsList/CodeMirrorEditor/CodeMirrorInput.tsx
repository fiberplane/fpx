import { cn } from "@/utils";
import "./CodeMirrorEditorCssOverrides.css";

import CodeMirror, { EditorView, gutter } from "@uiw/react-codemirror";
import { useMemo, useState } from "react";

const inputTheme = EditorView.theme({
  "&": {
    // HACK - Using tailwind `text-sm` values
    fontSize: "0.875rem",
    lineHeight: "1.25rem",

    background: "transparent !important",
    // letterSpacing: "0.025em",
  },
  ".cm-gutters": {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  ".cm-cursor": {
    borderLeftColor: "white",
  },
});

type CodeMirrorEditorProps = {
  readOnly?: boolean;
  minHeight?: string;
  width?: string;
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
};

// Configuration to disable all basic setup features on code mirror instance, so it behaves more like a text input
const CODE_MIRROR_BASIC_SETUP_DISABLE_ALL = {
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
};

const inputBaseStylesExtension = EditorView.theme({
  ".cm-placeholder": {
    color: "hsl(var(--muted-foreground))",
    // HACK - Using tailwind `text-sm` values
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  ".cm-scroller": {
    overflow: "hidden !important",
    maxWidth: "100% !important",
  },
});

// Hacky extension to modify the editor to look like an input and truncate text that overflows
// (This is used when the editor/input is not in focus)
const inputTrucateExtension = EditorView.theme({
  ".cm-content": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    width: "100%",
  },
  ".cm-line": {
    textOverflow: "ellipsis",
    overflow: "hidden",
    width: "100%",
  },
});

// Hide the gutter on the code mirror instance
const hiddenGutterExtension = gutter({ class: "hidden border-none" });

export function CodeMirrorInput(props: CodeMirrorEditorProps) {
  const { value, onChange, placeholder, width, minHeight = "28px" } = props;

  // State to manage focus
  const [isFocused, setIsFocused] = useState(false);

  // Dynamic height based on focus state
  const dynamicHeight = isFocused ? "auto" : minHeight;

  const style = useMemo(
    () => ({
      width: width ?? "100%", // if specified, this is a fixed width
      height: dynamicHeight, // dynamic height based on focus
      overflow: isFocused ? "auto" : "hidden", // show overflown context when focused, hide when not
      whiteSpace: isFocused ? "normal" : "nowrap", // change to ellipsis text truncation on blur
      textOverflow: isFocused ? "clip" : "ellipsis",
      cursor: "text", // show text cursor when hovering
    }),
    [width, dynamicHeight, isFocused],
  );

  return (
    <div
      className={cn(
        "rounded border border-transparent",
        "focus-visible:outline-none",
        {
          "border border-blue-600": isFocused,
          // HACK - This prevents a "jump" for the placeholder or input text when clicking on the input
          "border-l border-transparent": !isFocused,
        },
      )}
      style={style}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        height={dynamicHeight}
        theme={[inputTheme]}
        extensions={[
          hiddenGutterExtension,
          inputBaseStylesExtension,
          EditorView.lineWrapping,
          // NOTE: This is the CSS added by lineWrapping:
          /**
           ".cm-lineWrapping": {
              whiteSpace_fallback: "pre-wrap", // For IE
              whiteSpace: "break-spaces",
              wordBreak: "break-word", // For Safari, which doesn't support overflow-wrap: anywhere
              overflowWrap: "anywhere",
              flexShrink: 1
            },
           */
          isFocused ? EditorView.lineWrapping : inputTrucateExtension,
        ]}
        onFocus={() => setIsFocused(true)} // Set focus to true
        onBlur={() => setIsFocused(false)} // Set focus to false
        basicSetup={CODE_MIRROR_BASIC_SETUP_DISABLE_ALL}
        placeholder={placeholder}
      />
    </div>
  );
}
