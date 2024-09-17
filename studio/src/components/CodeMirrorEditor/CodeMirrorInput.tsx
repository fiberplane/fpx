import "./CodeMirrorEditorCssOverrides.css";

import { cn } from "@/utils";
import CodeMirror, { EditorView, gutter } from "@uiw/react-codemirror";
import { useMemo, useState } from "react";

const inputTheme = EditorView.theme({
  "&": {
    background: "transparent !important",
    // HACK - Using tailwind `text-sm` values
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  ".cm-gutters": {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  ".cm-cursor": {
    borderLeftColor: "white",
  },
});

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

// An extension that does nothing to make conditional extensions easier,
// e.g., `isFocused ? noopExtension : inputTrucateExtension`
const noopExtension = EditorView.theme({});

// Apply styles for the editor to make it look like one of our inputs
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

// Extension to truncate text that overflows
// We only want ot use this when the editor is *not* focused
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

// Extension for readonly mode, which makes the editor's cursor transparent,
// but uses a pointer cursor when the user hovers over the input,
// to indicate that you can click on it to expand it (in case the path parameter is truncated)
const readonlyExtension = EditorView.theme({
  ".cm-cursor": {
    borderLeftColor: "transparent !important",
  },
  ".cm-content": {
    cursor: "pointer !important",
  },
});

// Hide the gutter on the code mirror instance
const hiddenGutterExtension = gutter({ class: "hidden border-none" });

type CodeMirrorEditorProps = {
  readOnly?: boolean;
  width?: string;
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
};

export function CodeMirrorInput(props: CodeMirrorEditorProps) {
  const { value, onChange, placeholder, width, readOnly } = props;

  const [isFocused, setIsFocused] = useState(false);

  const style = useMemo(
    () => ({
      // if specified, the width should be a fixed width, otherwise we take up full width
      width: width ?? "100%",
      height: "auto",
      // show overflown content when focused, hide when not
      overflow: isFocused ? "auto" : "hidden",
      // change to ellipsis text truncation on blur
      whiteSpace: isFocused ? "normal" : "nowrap",
      textOverflow: isFocused ? "clip" : "ellipsis",
      // show text cursor when hovering
      cursor: "text",
    }),
    [width, isFocused],
  );

  const extensions = useMemo(() => {
    return [
      hiddenGutterExtension,
      inputBaseStylesExtension,
      //
      /**
       * NOTE: This is the CSS added by lineWrapping:
       
        ".cm-lineWrapping": {
            whiteSpace_fallback: "pre-wrap", // For IE
            whiteSpace: "break-spaces",
            wordBreak: "break-word", // For Safari, which doesn't support overflow-wrap: anywhere
            overflowWrap: "anywhere",
            flexShrink: 1
          }

       */
      EditorView.lineWrapping,
      readOnly ? readonlyExtension : noopExtension,
      isFocused ? noopExtension : inputTrucateExtension,
    ];
  }, [isFocused, readOnly]);

  return (
    <div
      className={cn(
        "rounded border border-transparent",
        "focus-visible:outline-none",
        {
          "border border-blue-600": isFocused && !readOnly,
          "border border-gray-600/50": isFocused && readOnly,
          // HACK - This prevents a horizontal "jump" for the placeholder or input text when clicking on the input
          // NOTE - There are still issues with vertical jumping on focus :(
          "border-l border-transparent": !isFocused,
        },
      )}
      style={style}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={[inputTheme]}
        indentWithTab={false}
        readOnly={readOnly}
        extensions={extensions}
        onFocus={() => setIsFocused(true)} // Set focus to true
        onBlur={() => setIsFocused(false)} // Set focus to false
        basicSetup={CODE_MIRROR_BASIC_SETUP_DISABLE_ALL}
        placeholder={placeholder}
      />
    </div>
  );
}
