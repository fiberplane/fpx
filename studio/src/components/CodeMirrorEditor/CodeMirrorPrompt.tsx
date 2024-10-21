import "./CodeMirrorEditorCssOverrides.css";

import { cn } from "@/utils";
import {
  type Completion,
  type CompletionContext,
  autocompletion,
} from "@codemirror/autocomplete";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import CodeMirror, {
  EditorView,
  type Extension,
  gutter,
} from "@uiw/react-codemirror";
import { useCallback, useMemo, useState } from "react";
import { createOnSubmitKeymap, escapeKeymap } from "./keymaps";

import type { ProbedRoute } from "@/pages/RequestorPage/types";
import { customTheme } from "./themes";

const promptTheme = EditorView.theme({
  "&": {
    background: "transparent !important",
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
  ".cm-tooltip": {
    border: "1px solid hsl(var(--border))",
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    borderRadius: "0.375rem",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  ".cm-tooltip .cm-completionLabel": {
    color: "hsl(var(--foreground))",
  },
  ".cm-tooltip .cm-completionMatchedText": {
    textDecoration: "none",
    fontWeight: "bold",
    color: "hsl(var(--primary))",
  },
  ".cm-tooltip .cm-completionDetail": {
    color: "hsl(var(--muted-foreground))",
  },
  ".cm-tooltip .cm-completionIcon": {
    display: "none",
  },
  ".cm-tooltip li[aria-selected]": {
    backgroundColor: "hsl(var(--accent))",
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
  autocompletion: true,
  rectangularSelection: false,
  highlightActiveLine: false,
  highlightSelectionMatches: false,
  closeBracketsKeymap: false,
  defaultKeymap: false,
  searchKeymap: false,
  historyKeymap: false,
  foldKeymap: false,
  completionKeymap: true,
  lintKeymap: false,
};

const noopExtension = EditorView.theme({});

const promptBaseStylesExtension = EditorView.theme({
  ".cm-placeholder": {
    color: "hsl(var(--muted-foreground))",
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
  ".cm-scroller": {
    overflow: "hidden !important",
    maxWidth: "100% !important",
  },
});

const hiddenGutterExtension = gutter({ class: "hidden border-none" });

type PromptCompletion = {
  data: Completion[];
  character: string;
};

type CodeMirrorPromptProps = {
  routes: ProbedRoute[];
  completions?: PromptCompletion[];
  className?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit: () => void;
  defaultRows?: number;
  onFocus?: () => void;
  onBlur?: () => void;
};

/**
 * @param data - The data to provide to the autocompletion extension
 * @param character - The character that triggers the autocompletion
 */
function completionsExtension(
  data: Completion[],
  character: string,
): Extension {
  return autocompletion({
    defaultKeymap: true,
    activateOnTyping: true,
    override: [
      (context: CompletionContext) => {
        const before = context.matchBefore(new RegExp(`\\${character}(\w+)?`));
        if (!before || (before.from === before.to && !context.explicit)) {
          return null;
        }
        return {
          // NOTE: +1 because we want to start the autocompletion AFTER the trigger character
          from: before ? before?.from + 1 : context.pos,
          options: data,
          // validFor: /^\w*$/,
        };
      },
    ],
  });
}

class RouteWidget extends WidgetType {
  constructor(
    private method: string,
    private path: string,
  ) {
    super();
  }

  toDOM() {
    const wrap = document.createElement("span");
    wrap.className =
      "cm-route-widget inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-primary/10 text-primary";
    wrap.textContent = `@${this.method} ${this.path}`;
    return wrap;
  }
}

function routeDecorations(routes: ProbedRoute[]) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        const pattern = /@\[route:(\d+)\]/g;

        for (const { from, to } of view.visibleRanges) {
          const text = view.state.doc.sliceString(from, to);
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(text)) !== null) {
            const start = from + match.index;
            const end = start + match[0].length;
            const routeId = Number.parseInt(match[1], 10);
            const route = routes.find((r) => r.id === routeId);
            if (route) {
              const decoration = Decoration.replace({
                widget: new RouteWidget(route.method, route.path),
              });
              builder.add(start, end, decoration);
            }
          }
        }

        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    },
  );
}

export function CodeMirrorPrompt(props: CodeMirrorPromptProps) {
  const {
    value,
    onChange,
    placeholder,
    className,
    onSubmit,
    onFocus,
    onBlur,
    completions,
    routes,
  } = props;

  const [isFocused, setIsFocused] = useState(false);
  const extensions = useMemo(() => {
    return [
      ...(completions?.map(({ data, character }) =>
        completionsExtension(data, character),
      ) ?? []),
      escapeKeymap,
      hiddenGutterExtension,
      promptBaseStylesExtension,
      EditorView.lineWrapping,
      isFocused
        ? noopExtension
        : EditorView.theme({
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
          }),
      createOnSubmitKeymap(onSubmit),
      customTheme,
      routeDecorations(routes),
    ];
  }, [isFocused, onSubmit, completions, routes]);
  const handleChange = useCallback(
    (value?: string) => {
      if (value !== undefined) {
        onChange(value);
      }
    },
    [onChange],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  return (
    <div
      className={cn(
        "h-full",
        "rounded border border-transparent",
        "cursor-text",
        "overflow-hidden whitespace-nowrap text-ellipsis",
        "focus-within:overflow-visible focus-within:whitespace-normal focus-within:text-clip",
        "focus-within:border-blue-600",
        className,
      )}
    >
      <CodeMirror
        minHeight="200px"
        value={value}
        onChange={handleChange}
        theme={[promptTheme]}
        indentWithTab={false}
        extensions={extensions}
        onFocus={handleFocus}
        onBlur={handleBlur}
        basicSetup={CODE_MIRROR_BASIC_SETUP}
        placeholder={placeholder}
        autoFocus
      />
    </div>
  );
}
