import "./CodeMirrorEditorCssOverrides.css";

import { REQUEST_HEADERS } from "@/constants";
import { cn } from "@/utils";
import { autocompletion } from "@codemirror/autocomplete";
import CodeMirror, { EditorView, gutter, keymap } from "@uiw/react-codemirror";
import { useMemo, useState } from "react";
import {
  createCmdBKeymap,
  createCmdGKeymap,
  createOnSubmitKeymap,
  escapeKeymap,
} from "./keymaps";

const inputTheme = EditorView.theme({
  "&": {
    background: "transparent !important",
    // HACK - Using tailwind `text-sm` values
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  // Hide the gutters
  ".cm-gutters": {
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  ".cm-cursor": {
    borderLeftColor: "hsl(var(--text-foreground))",
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

// Extension to truncate text that overflows with an ellipsis
// We only want to use this when the editor is *not* focused
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

// Extension for special styling in readonly mode, which makes the editor's cursor transparent,
// but uses a pointer cursor when the user hovers over the input,
// to indicate that you can click on it to expand it (in case the path parameter is truncated).
// As of writing, this is only used for the path parameter *key* input.
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

// Add this new theme extension for autocompletion styling
const autocompletionTheme = EditorView.theme({
  ".cm-tooltip": {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "calc(var(--radius) - 2px)",
  },
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "& > ul": {
      backgroundColor: "transparent",
      border: "none",
      maxHeight: "20em",
      minWidth: "15em",
    },
    "& > ul > li": {
      padding: "4px 8px",
      lineHeight: "1.25rem",
      color: "hsl(var(--popover-foreground))",
    },
    "& > ul > li[aria-selected]": {
      backgroundColor: "hsl(var(--accent))",
      color: "hsl(var(--accent-foreground))",
    },
  },
});

// Add this new extension for header key autocompletion
const headerKeyCompletions = autocompletion({
  override: [
    (context) => {
      const word = context.matchBefore(/[\w-]*/);
      if (!word) {
        return null;
      }

      return {
        from: word.from,
        options: REQUEST_HEADERS.map((header) => ({
          label: header.label,
          info: `${header.info}\n\n Example:\n ${header.example}`,
          type: "keyword",
        })),
        // Add these options to control appearance
        tooltip: {
          position: "below",
          createTooltip: undefined,
        },
      };
    },
  ],
});

export type CodeMirrorInputType = "header-key" | "header-value";

type CodeMirrorInputProps = {
  readOnly?: boolean;
  className?: string;
  value?: string;
  onChange: (value?: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  handleCmdG?: () => void;
  handleCmdB?: () => void;
  // A marker to add header completions: in the future other string enum values are possible
  inputType?: CodeMirrorInputType;
};

const preventNewlineInFirefox = keymap.of([
  {
    key: "Enter",
    run: () => {
      // Do nothingggg and don't bubble up the keyboard event
      // (Returning `true` means "we handled this keyboard event, don't bother delegating it to other extensions or the DOM")
      return true;
    },
  },
]);

const disabledStyling = "focus-within:border-neutral-400/50";
export const codeMirrorClassNames = cn(
  "h-auto",
  "rounded border border-transparent",
  // Show a text cursor on hover
  "cursor-text",
  // Show truncated text when not focused
  "overflow-hidden whitespace-nowrap text-ellipsis",
  // Show expanded text when focused
  "focus-within:overflow-visible focus-within:whitespace-normal focus-within:text-clip",
  // Show colorful border when focused
  "focus-within:border-primary",
  `disabled:${disabledStyling}`,
);

export function CodeMirrorInput(props: CodeMirrorInputProps) {
  const {
    value,
    onChange,
    placeholder,
    className,
    readOnly,
    onSubmit,
    handleCmdG,
    handleCmdB,
  } = props;

  const [isFocused, setIsFocused] = useState(false);

  const extensions = useMemo(() => {
    return [
      preventNewlineInFirefox,
      escapeKeymap,
      hiddenGutterExtension,
      inputBaseStylesExtension,
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
      createOnSubmitKeymap(onSubmit),
      createCmdGKeymap(handleCmdG, false, false),
      createCmdBKeymap(handleCmdB, false, false),
      // Add header key completions and its theme if this is a header key input
      props.inputType === "header-key"
        ? [headerKeyCompletions, autocompletionTheme]
        : noopExtension,
    ];
  }, [isFocused, readOnly, onSubmit, props.inputType, handleCmdG, handleCmdB]);

  return (
    <div
      className={cn(
        codeMirrorClassNames,
        readOnly && disabledStyling,
        className,
      )}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        theme={[inputTheme]}
        indentWithTab={false} // Allows us to skip to the next input when the user presses "tab"
        readOnly={readOnly}
        extensions={extensions}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        basicSetup={CODE_MIRROR_BASIC_SETUP_DISABLE_ALL}
        placeholder={placeholder}
      />
    </div>
  );
}
